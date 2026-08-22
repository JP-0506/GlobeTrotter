import './Button.css';

/**
 * Shared <Button> component.
 *
 * Props:
 *  - variant: 'primary' | 'secondary' | 'danger' (default: 'primary')
 *  - children: button label
 *  - ...rest:  all other props forwarded to <button>
 */
export default function Button({ variant = 'primary', children, className = '', ...rest }) {
  return (
    <button className={`btn btn--${variant} ${className}`} {...rest}>
      {children}
    </button>
  );
}
