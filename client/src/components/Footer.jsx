// client/src/components/Footer.jsx
import './footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__brand">Nexus</span>
        <p className="footer__copy">
          © {currentYear} · Student Collaboration Platform · End semester Project
        </p>
      </div>
    </footer>
  );
}

export default Footer;