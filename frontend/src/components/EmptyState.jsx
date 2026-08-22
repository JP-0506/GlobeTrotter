import './EmptyState.css';

/**
 * <EmptyState /> — shown when a list has no items.
 *
 * Props:
 *  - message: the text to display (e.g. "No trips yet")
 *  - children: optional action button below the message
 */
export default function EmptyState({ message, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">📭</div>
      <p className="empty-state__message">{message}</p>
      {children && <div className="empty-state__action">{children}</div>}
    </div>
  );
}
