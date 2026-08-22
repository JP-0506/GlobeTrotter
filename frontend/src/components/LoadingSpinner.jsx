import './LoadingSpinner.css';

/**
 * <LoadingSpinner /> — a centred CSS spinner.
 *
 * Props:
 *  - size: 'sm' | 'md' | 'lg' (default: 'md')
 */
export default function LoadingSpinner({ size = 'md' }) {
  return (
    <div className="spinner-wrapper">
      <div className={`spinner spinner--${size}`} role="status" aria-label="Loading">
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
