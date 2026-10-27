/** Icono dentro de un cuadro de color suave (tonos del logo). */
export default function IconBadge({ icon: Icon, tone = 'blue', size = 'md', className = '' }) {
  return (
    <span className={`icon-badge icon-badge--${tone} ${size === 'sm' ? 'icon-badge--sm' : ''} ${className}`.trim()} aria-hidden="true">
      <Icon size={size === 'sm' ? 20 : 26} strokeWidth={2} />
    </span>
  );
}
