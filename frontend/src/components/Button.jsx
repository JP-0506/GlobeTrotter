import LoadingSpinner from './LoadingSpinner';
import './Button.css';

/**
 * Shared <Button> component.
 *
 * Props:
 *  - variant: 'primary' | 'secondary' | 'danger' (default: 'primary')
 *  - loading: boolean (shows compact spinner and maintains button height)
 *  - children: button label
 *  - ...rest:  all other props forwarded to <button>
 */
export default function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...rest
}) {
  return (
    <button
      className={`btn btn--${variant} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="btn__loading-content">
          <LoadingSpinner size="sm" inline />
          <span>Please wait...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
