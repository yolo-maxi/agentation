"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchAnnotations,
  approveAnnotation,
  rejectAnnotation,
  reviseAnnotation,
  cancelAnnotation,
  type AnnotationSummary,
  type TokenValidation,
} from "../../api";
import styles from "./styles.module.scss";

// =============================================================================
// Types
// =============================================================================

export interface ReviewPanelProps {
  editToken: string;
  tokenInfo: TokenValidation;
  apiEndpoint?: string;
  enableMultiplayerFilter?: boolean;
  defaultFilter?: "active" | "review" | "mine" | "multiplayer";
  onAnnotationsLoaded?: (annotations: AnnotationSummary[]) => void;
  pollInterval?: number;
  onRefresh?: () => void;
  isDark?: boolean;
}

// =============================================================================
// Status Configuration
// =============================================================================

const STATUS_CONFIG: Record<string, { label: string; styleKey: string; icon: string }> = {
  pending: { label: "Pending", styleKey: "statusPending", icon: "⏳" },
  processing: { label: "Processing", styleKey: "statusProcessing", icon: "⚙️" },
  implemented: { label: "Review", styleKey: "statusImplemented", icon: "👀" },
  approved: { label: "Approved", styleKey: "statusApproved", icon: "✅" },
  completed: { label: "Done", styleKey: "statusCompleted", icon: "✅" },
  rejected: { label: "Rejected", styleKey: "statusRejected", icon: "❌" },
  revision_requested: { label: "Revising", styleKey: "statusRevision", icon: "🔄" },
  failed: { label: "Failed", styleKey: "statusFailed", icon: "💥" },
  interrupted: { label: "Interrupted", styleKey: "statusInterrupted", icon: "⏸️" },
  archived: { label: "Archived", styleKey: "statusArchived", icon: "📦" },
};

// =============================================================================
// Sub-components
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const styleClass = styles[config.styleKey as keyof typeof styles] || "";
  return (
    <span className={`${styles.statusBadge} ${styleClass}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

function TimeAgo({ timestamp }: { timestamp: number }) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return <span>{seconds}s ago</span>;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return <span>{minutes}m ago</span>;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return <span>{hours}h ago</span>;
  const days = Math.floor(hours / 24);
  return <span>{days}d ago</span>;
}

interface RevisionModalProps {
  annotation: AnnotationSummary;
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  isDark: boolean;
}

function RevisionModal({ annotation, onSubmit, onCancel, isLoading, isDark }: RevisionModalProps) {
  const [prompt, setPrompt] = useState("");

  return (
    <div className={styles.modalBackdrop}>
      <div className={`${styles.modal} ${!isDark ? styles.light : ""}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Request Revision</h3>
          <p className={styles.modalSubtitle}>
            Describe what changes you want to the current implementation
          </p>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.originalRequest}>
            <p className={styles.originalLabel}>Original request:</p>
            <p className={styles.originalText}>{annotation.comment}</p>
          </div>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Make the color darker, move it to the left, add more padding..."
            className={styles.textarea}
            autoFocus
          />
          
          {annotation.revisionCount > 0 && (
            <p className={styles.revisionCount}>
              This annotation has been revised {annotation.revisionCount} time(s)
            </p>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={styles.modalCancelButton}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(prompt)}
            disabled={isLoading || !prompt.trim()}
            className={styles.modalSubmitButton}
          >
            {isLoading ? (
              <>
                <span className={styles.buttonSpinner} />
                Submitting...
              </>
            ) : (
              "Submit Revision"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ReviewPanel({
  editToken,
  tokenInfo,
  apiEndpoint,
  enableMultiplayerFilter = true,
  defaultFilter,
  onAnnotationsLoaded,
  pollInterval = 10000,
  onRefresh,
  isDark: isDarkProp,
}: ReviewPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkInternal, setIsDarkInternal] = useState(true);
  
  // Sync dark mode from toolbar's localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      const saved = localStorage.getItem('feedback-toolbar-theme');
      setIsDarkInternal(saved !== 'light');
    };
    sync();
    const interval = setInterval(sync, 500);
    return () => clearInterval(interval);
  }, []);
  
  const isDark = isDarkProp !== undefined ? isDarkProp : isDarkInternal;
  
  const [annotations, setAnnotations] = useState<AnnotationSummary[]>([]);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem('archived_annotations');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revisionTarget, setRevisionTarget] = useState<AnnotationSummary | null>(null);
  const [filter, setFilter] = useState<"active" | "review" | "mine" | "multiplayer">(
    defaultFilter ?? "active",
  );
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('archived_annotations', JSON.stringify([...archivedIds]));
    }
  }, [archivedIds]);

  const loadAnnotations = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchAnnotations(editToken, true, apiEndpoint);
    data.sort((a, b) => b.timestamp - a.timestamp);
    setAnnotations(data);
    onAnnotationsLoaded?.(data);
    setIsLoading(false);
  }, [editToken, apiEndpoint, onAnnotationsLoaded]);

  useEffect(() => {
    if (isOpen) loadAnnotations();
  }, [isOpen, loadAnnotations]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(loadAnnotations, pollInterval);
    return () => clearInterval(interval);
  }, [isOpen, loadAnnotations, pollInterval]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    const result = await approveAnnotation(editToken, id, apiEndpoint);
    if (result.success) {
      await loadAnnotations();
      onRefresh?.();
    } else {
      alert(result.error || "Failed to approve");
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection (optional):");
    setActionLoading(id);
    const result = await rejectAnnotation(editToken, id, reason || undefined, apiEndpoint);
    if (result.success) {
      await loadAnnotations();
      onRefresh?.();
    } else {
      alert(result.error || "Failed to reject");
    }
    setActionLoading(null);
  };

  const handleRevisionSubmit = async (promptText: string) => {
    if (!revisionTarget) return;
    setActionLoading(revisionTarget.id);
    const result = await reviseAnnotation(editToken, revisionTarget.id, promptText, apiEndpoint);
    if (result.success) {
      setRevisionTarget(null);
      await loadAnnotations();
      onRefresh?.();
    } else {
      alert(result.error || "Failed to submit revision");
    }
    setActionLoading(null);
  };

  const handleArchive = (id: string) => {
    setArchivedIds(prev => new Set([...prev, id]));
  };

  const handleUnarchive = (id: string) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this annotation? It will be marked as rejected.")) return;
    setActionLoading(id);
    const result = await cancelAnnotation(editToken, id, undefined, apiEndpoint);
    if (result.success) {
      await loadAnnotations();
    }
    setActionLoading(null);
  };

  const filteredAnnotations = annotations.filter((a) => {
    const isArchived = archivedIds.has(a.id);
    if (showArchived) return isArchived;
    if (isArchived) return false;
    if (filter === "active") {
      return ["pending", "processing", "implemented", "revision_requested"].includes(a.status);
    }
    if (filter === "review") return a.status === "implemented";
    if (filter === "mine") return a.isOwn;
    if (filter === "multiplayer") return !a.isOwn;
    return true;
  });

  const reviewCount = annotations.filter((a) => a.status === "implemented" && !archivedIds.has(a.id)).length;
  const activeCount = annotations.filter((a) =>
    ["pending", "processing", "implemented", "revision_requested"].includes(a.status) && !archivedIds.has(a.id)
  ).length;

  const getActions = (a: AnnotationSummary) => {
    const canManage = a.isOwn || tokenInfo.isAdmin;
    switch (a.status) {
      case "pending": return canManage ? ["cancel", "archive"] : ["archive"];
      case "processing": return ["archive"];
      case "implemented": return canManage ? ["approve", "edit", "reject"] : ["archive"];
      default: return ["archive"];
    }
  };

  return (
    <>
      {/* Toggle button - sits inside toolbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.toggleButton} ${isOpen ? styles.active : ""}`}
        title={isOpen ? "Close annotations" : "Open annotations"}
      >
        <span>{isOpen ? "✕" : (reviewCount > 0 ? "👀" : "📋")}</span>
        {activeCount > 0 && !isOpen && (
          <span className={styles.badge}>{activeCount}</span>
        )}
      </button>

      {/* Panel - fixed above toolbar */}
      {isOpen && (
        <div className={`${styles.panel} ${!isDark ? styles.light : ""}`}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h2 className={styles.title}>Annotations</h2>
              <div className={styles.headerActions}>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`${styles.iconButton} ${showArchived ? styles.active : ""}`}
                  title={showArchived ? "Show active" : "Show archived"}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showArchived ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={loadAnnotations}
                  disabled={isLoading}
                  className={styles.iconButton}
                  title="Refresh"
                >
                  <svg className={isLoading ? styles.spinner : ""} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {!showArchived && (
              <div className={styles.filters}>
                {[
                  { key: "active", label: `Active (${activeCount})` },
                  { key: "review", label: `Review (${reviewCount})`, highlight: reviewCount > 0 },
                  { key: "mine", label: "Mine" },
                  ...(enableMultiplayerFilter ? [{ key: "multiplayer", label: "Multiplayer" }] : []),
                ].map(({ key, label, highlight }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as typeof filter)}
                    className={`${styles.filterButton} ${filter === key ? styles.active : ""} ${highlight ? styles.highlight : ""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {showArchived && (
              <p className={styles.hiddenCount}>Showing {archivedIds.size} archived item(s)</p>
            )}
          </div>

          <div className={styles.listContainer}>
            {filteredAnnotations.length === 0 ? (
              <div className={styles.emptyState}>
                {isLoading ? "Loading..." : showArchived ? "No archived items" : "No annotations"}
              </div>
            ) : (
              <div className={styles.list}>
                {filteredAnnotations.map((a) => {
                  const actions = getActions(a);
                  const isArchived = archivedIds.has(a.id);

                  return (
                    <div key={a.id} className={styles.item}>
                      <div className={styles.itemHeader}>
                        <div className={styles.itemHeaderLeft}>
                          <StatusBadge status={a.status} />
                          <span className={styles.timeAgo}>
                            <TimeAgo timestamp={a.timestamp} />
                          </span>
                        </div>
                        <span className={`${styles.owner} ${a.isOwn ? styles.isOwn : ""}`}>
                          {a.tokenOwner}
                        </span>
                      </div>

                      <p className={styles.comment}>{a.comment}</p>
                      <p className={styles.element}>{a.element}</p>

                      <div className={styles.actions}>
                        {isArchived ? (
                          <button
                            onClick={() => handleUnarchive(a.id)}
                            className={`${styles.actionButton} ${styles.hideButton}`}
                          >
                            Unarchive
                          </button>
                        ) : (
                          <>
                            {actions.includes("approve") && (
                              <button
                                onClick={() => handleApprove(a.id)}
                                disabled={actionLoading === a.id}
                                className={`${styles.actionButton} ${styles.approveButton}`}
                              >
                                {actionLoading === a.id ? "..." : "✓ Approve"}
                              </button>
                            )}
                            {actions.includes("edit") && (
                              <button
                                onClick={() => setRevisionTarget(a)}
                                disabled={actionLoading === a.id}
                                className={`${styles.actionButton} ${styles.editButton}`}
                              >
                                ✎ Edit
                              </button>
                            )}
                            {actions.includes("reject") && (
                              <button
                                onClick={() => handleReject(a.id)}
                                disabled={actionLoading === a.id}
                                className={`${styles.actionButton} ${styles.rejectButton}`}
                              >
                                ✕ Reject
                              </button>
                            )}
                            {actions.includes("cancel") && (
                              <button
                                onClick={() => handleCancel(a.id)}
                                disabled={actionLoading === a.id}
                                className={`${styles.actionButton} ${styles.cancelButton}`}
                              >
                                Cancel
                              </button>
                            )}
                            {actions.includes("archive") && (
                              <button
                                onClick={() => handleArchive(a.id)}
                                className={`${styles.actionButton} ${styles.hideButton}`}
                              >
                                Archive
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {a.commitSha && (
                        <p className={styles.commitInfo}>commit: {a.commitSha.slice(0, 7)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Logged in as <span className={styles.userName}>{tokenInfo.name}</span>
              {tokenInfo.isAdmin && <span className={styles.adminBadge}>(admin)</span>}
            </p>
          </div>
        </div>
      )}

      {revisionTarget && (
        <RevisionModal
          annotation={revisionTarget}
          onSubmit={handleRevisionSubmit}
          onCancel={() => setRevisionTarget(null)}
          isLoading={actionLoading === revisionTarget.id}
          isDark={isDark}
        />
      )}
    </>
  );
}

export default ReviewPanel;
