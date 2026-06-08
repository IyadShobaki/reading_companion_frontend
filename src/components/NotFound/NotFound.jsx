import { Link } from "react-router-dom";
import "./NotFound.css";

/**
 * NotFound — rendered for any route that does not match a defined path.
 *
 * Provides a clear, friendly message and a link back to the home page so
 * users are never stuck on a blank screen.
 */
function NotFound() {
  return (
    <main className="not-found">
      <h1 className="not-found__code">404</h1>
      <p className="not-found__message">
        Oops — we couldn&apos;t find that page.
      </p>
      <Link to="/" className="not-found__home-link">
        Go back home
      </Link>
    </main>
  );
}

export default NotFound;
