import "./Loading.css";

// Animated loading indicator rendered while async operations are in flight.
// The `name` prop lets callers use a custom CSS class for different sizes/contexts.
function Loading({ name = "loading" }) {
  return (
    <div className={name}>
      <span className="loading__drop" />
      <span className="loading__drop" />
      <span className="loading__drop" />
    </div>
  );
}

export default Loading;
