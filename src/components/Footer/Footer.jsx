import "./Footer.css";

// Computed once at module scope — no need to recalculate on every render
const currentYear = new Date().getFullYear();

// Displays a dynamic copyright year range once the year exceeds the launch year.
function Footer() {
  return (
    <footer className="footer">
      <p className="footer__text">Developed by Iyad Shobaki</p>
      <p className="footer__text">
        &copy; {currentYear > 2026 ? `2026 - ${currentYear}` : currentYear}
      </p>
    </footer>
  );
}

export default Footer;
