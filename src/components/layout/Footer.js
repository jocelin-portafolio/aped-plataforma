import { contact } from '@/config/navigation';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <strong>APED</strong>
          <p>Agrupación Personas Empoderadas por la Discapacidad</p>
        </div>
        <div className="footer-col">
          <h4>Contacto</h4>
          <address>
            <p>{contact.address.street}</p>
            <p>{contact.address.comune}, {contact.address.city}</p>
            <p>{contact.address.country}</p>
          </address>
          <a
            href={contact.phone.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
          >
            WhatsApp: {contact.phone.display}
          </a>
        </div>
        <div className="footer-col">
          <h4>Síguenos</h4>
          <a
            href={contact.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
          >
            Instagram: {contact.social.instagramHandle}
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} APED. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
