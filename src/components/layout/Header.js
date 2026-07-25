import { navigation } from '@/config/navigation';

export default function Header() {
  return (
    <header className="site-header">
      <a href="/" aria-label="APED - Inicio" className="header-logo">
        <img
          src="/images/logo.jpeg"
          alt="APED - Agrupación Personas Empoderadas por la Discapacidad"
          width="48"
          height="48"
        />
        <span className="header-logo-text">APED</span>
      </a>
      <nav aria-label="Navegación principal">
        <ul>
          {navigation.main.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
