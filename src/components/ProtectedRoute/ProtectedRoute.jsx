import { Navigate, useLocation } from "react-router-dom";
import Loading from "../Loading/Loading";

// Guards a route so only authenticated users can access it.
// Shows a loading spinner while the session check is still in flight to
// prevent a flash redirect before auth state is known.
// If unauthenticated, redirects to "/" and stores the attempted path in
// location state so the user can be sent back after login.
function ProtectedRoute({ isLoggedIn, isLoading, children }) {
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }
  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
