/**
 * Animated aurora mesh — three slow-drifting blobs of brand color tinted
 * behind page content. Adds depth without distracting from foreground.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="aurora-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora-blob aurora-blob--1" />
      <div className="aurora-blob aurora-blob--2" />
      <div className="aurora-blob aurora-blob--3" />
      <div className="aurora-grid" />
    </div>
  );
}
