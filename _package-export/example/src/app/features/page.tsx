"use client";

import { Footer } from "../Footer";
import { FeaturesDemo, SmartIdentificationDemo, MarkerKeyDemo, ComputedStylesDemo } from "../components/FeaturesDemo";

export default function FeaturesPage() {
  return (
    <>
      <article className="article">
      <header>
        <h1>Features</h1>
        <p className="tagline">Everything Agentation can do</p>
      </header>

      <section>
        <h2>Annotation modes</h2>
        <p>
          Click the tabs below to see examples of each annotation mode:
        </p>
        <FeaturesDemo />
      </section>

      <section>
        <h2>Toolbar controls</h2>
        <ul>
          <li><svg style={{ display: 'inline-block', verticalAlign: '-0.38em', width: '1.5em', height: '1.5em', margin: '0 -0.1em 0 0' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 6L8 18" /><path d="M16 18L16 6" /></svg> <strong>Pause</strong> <span style={{ color: 'rgba(0,0,0,0.25)', margin: '0 0.25em' }}>•</span> Freeze CSS animations to annotate specific states</li>
          <li><svg style={{ display: 'inline-block', verticalAlign: '-0.38em', width: '1.5em', height: '1.5em', margin: '0 -0.1em 0 0' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.91752 12.7539C3.65127 12.2889 3.65127 11.7111 3.91752 11.2461C5.42678 8.59839 8.46097 6.25 12 6.25C15.539 6.25 18.5732 8.59839 20.0825 11.2461C20.3487 11.7111 20.3487 12.2889 20.0825 12.7539C18.5732 15.4016 15.539 17.75 12 17.75C8.46097 17.75 5.42678 15.4016 3.91752 12.7539Z" /><path d="M12 14.8261C13.5608 14.8261 14.8261 13.5608 14.8261 12C14.8261 10.4392 13.5608 9.17391 12 9.17391C10.4392 9.17391 9.17391 10.4392 9.17391 12C9.17391 13.5608 10.4392 14.8261 12 14.8261Z" /></svg> <strong>Visibility</strong> <span style={{ color: 'rgba(0,0,0,0.25)', margin: '0 0.25em' }}>•</span> Toggle annotation markers on/off while working</li>
        </ul>
        <p style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.5)', marginTop: '0.75rem' }}>
          Drag the toolbar to reposition it. Click a marker to remove it, or right-click to edit.
        </p>
      </section>

      <section>
        <h2>Marker types</h2>
        <p>
          Different annotation modes use different marker styles.
        </p>
        <MarkerKeyDemo />
      </section>

      <section>
        <h2>Smart identification</h2>
        <p>
          Agentation automatically identifies elements in a way that&rsquo;s useful for code search.
          This makes it easy for agents to <code>grep</code> for the exact element in your codebase.
        </p>
        <SmartIdentificationDemo />
      </section>

      <section>
        <h2>Computed styles</h2>
        <p>
          View the computed CSS styles for any element directly in the annotation popup.
          Expand the collapsible section to see relevant properties like colors, fonts, and spacing.
        </p>
        <ComputedStylesDemo />
      </section>

      <section>
        <h2>Keyboard shortcuts</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <tbody>
            <tr>
              <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}><code>Cmd+Shift+A</code> / <code>Ctrl+Shift+A</code></td>
              <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)', textAlign: 'right' }}>Toggle feedback mode</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}><code>Esc</code></td>
              <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)', textAlign: 'right' }}>Close toolbar or cancel</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}><code>P</code></td>
              <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)', textAlign: 'right' }}>Pause/resume animations</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}><code>H</code></td>
              <td style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)', textAlign: 'right' }}>Hide/show markers</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', marginTop: '0.75rem' }}>
          Shortcuts are disabled when typing in an input field.
        </p>
      </section>

      <section>
        <h2>Limitations</h2>
        <ul>
          <li><strong>Desktop only</strong> &mdash; The tool requires a desktop browser, but you can still request mobile changes in your feedback</li>
          <li><strong>Per-page storage</strong> &mdash; Annotations persist in localStorage for 7 days</li>
          <li><strong>Single page</strong> &mdash; Annotations don&rsquo;t follow across navigation</li>
          <li><strong>Static positions</strong> &mdash; Markers don&rsquo;t update if layout changes</li>
          <li><strong>No screenshots</strong> &mdash; Output is text-only (paste alongside screenshots if needed)</li>
          <li><strong>CSS animations only</strong> &mdash; Pause works on CSS animations, not JS-driven animations (framer-motion, GSAP, etc.)</li>
          <li><strong>React only</strong> &mdash; Currently requires React 18+</li>
        </ul>
      </section>
    </article>

    <Footer />
    </>
  );
}
