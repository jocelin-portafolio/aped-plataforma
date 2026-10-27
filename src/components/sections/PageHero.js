/** Encabezado de las páginas internas: etiqueta, título, bajada y datos clave. */
export default function PageHero({ eyebrow, eyebrowIcon: EyebrowIcon, title, lead, chips = [] }) {
  return (
    <header className="page-hero">
      <div className="container">
        {eyebrow && (
          <span className="eyebrow">
            {EyebrowIcon && <EyebrowIcon size={14} strokeWidth={2.5} aria-hidden="true" />}
            {eyebrow}
          </span>
        )}
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
        {chips.length > 0 && (
          <ul className="page-hero-chips">
            {chips.map(({ icon: Icon, label }) => (
              <li key={label}>
                <Icon size={16} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
