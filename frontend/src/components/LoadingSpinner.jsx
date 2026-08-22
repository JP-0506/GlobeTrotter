import './LoadingSpinner.css';

/**
 * <LoadingSpinner /> — a centred or inline CSS spinner.
 *
 * Props:
 *  - size: 'sm' | 'md' | 'lg' (default: 'md')
 *  - inline: boolean (removes extra wrapper padding for buttons/inline usage)
 */
export default function LoadingSpinner({ size = 'md', inline = false, color }) {
  const isInline = inline || size === 'sm';

  return (
    <div className={`spinner-wrapper ${isInline ? 'spinner-wrapper--inline' : ''}`}>
      <div
        className={`spinner spinner--${size}`}
        style={color ? { borderTopColor: color } : undefined}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
