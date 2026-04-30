import { Component } from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this._handleReset = this._handleReset.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  _handleReset() {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">
            An unexpected error occurred. Please try again or refresh the page.
          </p>
          <button
            className="error-boundary__button"
            onClick={this._handleReset}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
