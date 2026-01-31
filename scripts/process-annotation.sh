#!/bin/bash
# Process an agentation annotation using Claude CLI directly
# Usage: ./scripts/process-annotation.sh <annotation_id> [new|revision]
# 
# Flow:
# 1. Fetch annotation from API
# 2. Mark as "processing"
# 3. Run Claude CLI with the task
# 4. Commit changes with descriptive message
# 5. Mark as "implemented" with commit SHA
# 6. Send notification

set -e

ANNOTATION_ID="$1"
MODE="${2:-new}"  # "new" or "revision"
API_BASE="https://agentation.repo.box"
TELEGRAM_GROUP="-1003850294102"
TELEGRAM_TOPIC="315"  # Agentation notifications topic
ADMIN_TOKEN="${ADMIN_TOKEN:-$(cat /home/xiko/agentation-api/.env | grep ADMIN_TOKEN | cut -d= -f2)}"

if [ -z "$ANNOTATION_ID" ]; then
  echo "Usage: $0 <annotation_id> [new|revision]"
  exit 1
fi

# Fetch annotation details
echo "📥 Fetching annotation ${ANNOTATION_ID}..."
ANNOTATION=$(curl -s "${API_BASE}/api/admin/annotations?adminToken=${ADMIN_TOKEN}" | jq -r ".[] | select(.id == \"${ANNOTATION_ID}\")")

if [ -z "$ANNOTATION" ] || [ "$ANNOTATION" == "null" ]; then
  echo "❌ Annotation not found: ${ANNOTATION_ID}"
  exit 1
fi

# Extract fields
PROJECT=$(echo "$ANNOTATION" | jq -r '.project')
ELEMENT=$(echo "$ANNOTATION" | jq -r '.data.element')
ELEMENT_PATH=$(echo "$ANNOTATION" | jq -r '.data.elementPath')
COMMENT=$(echo "$ANNOTATION" | jq -r '.data.comment')
PAGE_URL=$(echo "$ANNOTATION" | jq -r '.data.pageUrl // "unknown"')
SELECTED_TEXT=$(echo "$ANNOTATION" | jq -r '.data.selectedText // ""')
NEARBY_TEXT=$(echo "$ANNOTATION" | jq -r '.data.nearbyText // ""')
IMAGE_URL=$(echo "$ANNOTATION" | jq -r '.data.imageUrl // ""')
TOKEN_OWNER=$(echo "$ANNOTATION" | jq -r '.tokenOwner // "Unknown"')
PREV_COMMIT=$(echo "$ANNOTATION" | jq -r '.commitSha // ""')

# Get revision history for revision mode
REVISION_PROMPT=""
if [ "$MODE" == "revision" ]; then
  REVISION_PROMPT=$(echo "$ANNOTATION" | jq -r '.revisionHistory[-1].prompt // ""')
  echo "🔄 Revision mode - prompt: ${REVISION_PROMPT:0:50}..."
fi

# Get project config for repo path
REPO_PATH=$(curl -s "${API_BASE}/api/admin/projects?adminToken=${ADMIN_TOKEN}" | jq -r ".[] | select(.project == \"${PROJECT}\") | .repoPath")

if [ -z "$REPO_PATH" ] || [ "$REPO_PATH" == "null" ]; then
  echo "❌ No repo path configured for project: ${PROJECT}"
  exit 1
fi

echo "📁 Project: ${PROJECT}"
echo "📂 Repo: ${REPO_PATH}"
echo "🎯 Element: ${ELEMENT}"
echo "💬 Request: ${COMMENT}"
echo "👤 Requested by: ${TOKEN_OWNER}"

# Mark as processing
echo "⏳ Marking as processing..."
curl -s -X PATCH "${API_BASE}/api/admin/annotations/${ANNOTATION_ID}?adminToken=${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status":"processing"}' > /dev/null

# Build the prompt for Claude
if [ "$MODE" == "revision" ] && [ -n "$REVISION_PROMPT" ]; then
  # Revision mode - reference previous commit and apply changes
  PROMPT="You are working on the ${PROJECT} project.

TASK: Revision to previous implementation

This is a REVISION request. The user reviewed your previous implementation and wants changes.

Original request:
Element: ${ELEMENT}
${COMMENT}

Previous commit: ${PREV_COMMIT}

REVISION REQUEST:
${REVISION_PROMPT}

---
Instructions:
1. Review the current state of the code (your previous changes are already applied)
2. Apply the requested revisions
3. Keep changes minimal and focused on the revision request
4. Build and verify the changes work

Start working on this revision now."
else
  # New annotation mode
  PROMPT="You are working on the ${PROJECT} project.

TASK: UI/UX change request from user annotation

Element: ${ELEMENT}
Element path: ${ELEMENT_PATH}
Page: ${PAGE_URL}
${SELECTED_TEXT:+Selected text: \"${SELECTED_TEXT}\"}
${NEARBY_TEXT:+Context: \"${NEARBY_TEXT}\"}
${IMAGE_URL:+Reference image: ${IMAGE_URL}}

REQUEST:
${COMMENT}

---
Instructions:
1. Make the requested changes to the codebase
2. Build and verify the changes work
3. Keep changes minimal and focused
4. If the request is unclear, make a reasonable interpretation

Start working on this task now."
fi

# Run Claude CLI
echo "🤖 Running Claude..."
cd "$REPO_PATH"

# Pipe prompt instead of -p flag (workaround for Claude CLI bug where -p hangs)
if echo "$PROMPT" | claude \
  --model sonnet \
  --dangerously-skip-permissions \
  --allowedTools "Read,Edit,Write,Bash" \
  2>&1; then
  
  echo "✅ Claude completed successfully"
  
  # Check if there are changes to commit
  if git diff --quiet && git diff --cached --quiet; then
    echo "⚠️ No changes detected"
    COMMIT_SHA=""
  else
    # Stage all changes
    git add -A
    
    # Create commit message
    SHORT_COMMENT="${COMMENT:0:50}"
    if [ ${#COMMENT} -gt 50 ]; then
      SHORT_COMMENT="${SHORT_COMMENT}..."
    fi
    
    if [ "$MODE" == "revision" ]; then
      COMMIT_MSG="[Annotation] Revision: ${SHORT_COMMENT}

Requested by: ${TOKEN_OWNER}
Annotation ID: ${ANNOTATION_ID}
Revision: ${REVISION_PROMPT:0:200}

Original request:
${COMMENT:0:500}"
    else
      COMMIT_MSG="[Annotation] ${SHORT_COMMENT}

Requested by: ${TOKEN_OWNER}
Annotation ID: ${ANNOTATION_ID}

Request:
${COMMENT:0:500}"
    fi
    
    # Commit
    git commit -m "$COMMIT_MSG"
    COMMIT_SHA=$(git rev-parse HEAD)
    echo "📝 Committed: ${COMMIT_SHA:0:7}"
    
    # Push (assuming we're on main or the appropriate branch)
    git push origin HEAD 2>&1 || echo "⚠️ Push failed (may need manual intervention)"
  fi
  
  # Mark as implemented with commit SHA
  echo "📋 Marking as implemented..."
  curl -s -X PATCH "${API_BASE}/api/admin/annotations/${ANNOTATION_ID}?adminToken=${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"implemented\", \"commitSha\":\"${COMMIT_SHA}\"}" > /dev/null
  
  STATUS_MSG="✅ Implemented"
  if [ -n "$COMMIT_SHA" ]; then
    STATUS_MSG="${STATUS_MSG} (${COMMIT_SHA:0:7})"
  fi
else
  # Failed - mark as failed
  echo "❌ Claude failed"
  curl -s -X PATCH "${API_BASE}/api/admin/annotations/${ANNOTATION_ID}?adminToken=${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"status":"failed"}' > /dev/null
  
  STATUS_MSG="❌ Failed"
fi

# Send notification
NOTIFY_MSG="${STATUS_MSG}
👤 ${TOKEN_OWNER}
🎯 ${ELEMENT}
💬 ${COMMENT:0:80}...

Review at beamr-dev.repo.box"

clawdbot message send --channel telegram \
  --target "$TELEGRAM_GROUP" \
  --thread-id "$TELEGRAM_TOPIC" \
  --message "$NOTIFY_MSG" 2>/dev/null || true

echo "🏁 Done processing ${ANNOTATION_ID}"
