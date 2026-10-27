export default function Section({
  children,
  id,
  title,
  subtitle,
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  align = 'center',
  tinted = false,
  className = '',
  ariaLabelledby,
  ...props
}) {
  const headingId = ariaLabelledby || (title ? `${id || 'section'}-title` : undefined);

  return (
    <section
      className={`section ${tinted ? 'section--tinted' : ''} ${className}`.trim()}
      id={id}
      aria-labelledby={headingId}
      {...props}
    >
      <div className="container">
        {title && (
          <header className={`section-header ${align === 'left' ? 'section-header--left' : ''}`.trim()}>
            {eyebrow && (
              <span className="eyebrow">
                {EyebrowIcon && <EyebrowIcon size={14} strokeWidth={2.5} aria-hidden="true" />}
                {eyebrow}
              </span>
            )}
            <h2 id={headingId}>{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
