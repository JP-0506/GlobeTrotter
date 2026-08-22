import './Input.css';

/**
 * Shared <Input> component — labeled text input.
 *
 * Props:
 *  - label:  the visible label text
 *  - id:     optional id (auto-generated from label if omitted)
 *  - type:   input type (default: 'text')
 *  - error:  optional error message string
 *  - ...rest: forwarded to <input>
 */
export default function Input({ label, id, type = 'text', error, className = '', ...rest }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="input-group__label">{label}</label>}
      <input
        id={inputId}
        type={type}
        className="input-group__input"
        {...rest}
      />
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
}
