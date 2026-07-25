export default function Section({
  children,
  id,
  title,
  subtitle,
  className = '',
  ariaLabelledby,
  ...props
}) {
  const headingId = ariaLabelledby || (title ? `${id || 'section'}-title` : undefined);

  return (
    <section
      className={`section ${className}`.trim()}
      id={id}
      aria-labelledby={headingId}
      {...props}
    >
      {title && <h2 id={headingId}>{title}</h2>}
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      {children}
    </section>
  );
}
