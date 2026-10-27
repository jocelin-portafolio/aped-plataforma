import Link from 'next/link';
import { MapPin, MessageCircle, Instagram, Clock, ChevronRight, LogIn } from 'lucide-react';
import { contact, navigation } from '@/config/navigation';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">
              <img src="/images/logo.jpeg" alt="" width="44" height="44" />
              <strong>APED</strong>
            </div>
            <p>
              Agrupación Personas Empoderadas por la Discapacidad. Servicios clínicos y talleres
              grupales en Maipú, con atención cercana y personalizada.
            </p>
          </div>

          <div className="footer-col">
            <h4>Navegación</h4>
            <ul className="footer-links">
              {navigation.main.map((item) => (
                <li key={item.href}>
                  <ChevronRight size={16} aria-hidden="true" />
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contacto</h4>
            <ul className="footer-links">
              <li>
                <MapPin size={16} aria-hidden="true" />
                <address>
                  {contact.address.street}, {contact.address.comune}, {contact.address.city}
                </address>
              </li>
              <li>
                <MessageCircle size={16} aria-hidden="true" />
                <a href={contact.phone.whatsapp} target="_blank" rel="noopener noreferrer">
                  WhatsApp {contact.phone.display}
                </a>
              </li>
              <li>
                <Instagram size={16} aria-hidden="true" />
                <a href={contact.social.instagram} target="_blank" rel="noopener noreferrer">
                  {contact.social.instagramHandle}
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Horario</h4>
            <ul className="footer-links">
              <li>
                <Clock size={16} aria-hidden="true" />
                <span>
                  Lunes a sábado
                  <br />
                  09:00 a 18:00
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} APED. Todos los derechos reservados.</p>
          <a href="/login" className="footer-staff-link">
            <LogIn size={14} aria-hidden="true" />
            Acceso equipo
          </a>
        </div>
      </div>
    </footer>
  );
}
