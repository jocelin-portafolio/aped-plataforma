'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stethoscope, Users, HeartHandshake, CalendarCheck, Menu, X } from 'lucide-react';
import { navigation } from '@/config/navigation';

const NAV_ICONS = {
  '/servicios-clinicos': Stethoscope,
  '/talleres': Users,
  '/apoyanos': HeartHandshake,
};

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Al navegar se cierra el menú móvil.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" aria-label="APED - Inicio" className="header-logo">
          <img src="/images/logo.jpeg" alt="" width="46" height="46" />
          <span className="header-logo-text">
            <strong>APED</strong>
            <small>Personas Empoderadas por la Discapacidad</small>
          </span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>

        <nav id="site-nav" aria-label="Navegación principal" className={`site-nav ${open ? 'is-open' : ''}`.trim()}>
          <ul>
            {navigation.main.map((item) => {
              const Icon = NAV_ICONS[item.href];
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>
                    {Icon && <Icon size={17} strokeWidth={2.25} aria-hidden="true" />}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href="/servicios-clinicos#reservar" className="btn btn-primary btn--sm">
            <CalendarCheck size={17} aria-hidden="true" />
            Reservar hora
          </Link>
        </nav>
      </div>
    </header>
  );
}
