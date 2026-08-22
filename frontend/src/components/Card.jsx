import './Card.css';

/**
 * Shared <Card> component — bordered, shadowed container.
 *
 * Use for trip cards, city cards, activity cards, etc.
 *
 * Props:
 *  - children: card content
 *  - className: extra CSS classes
 *  - ...rest:   forwarded to the wrapper div
 */
export default function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}
