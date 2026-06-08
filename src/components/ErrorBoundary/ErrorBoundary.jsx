import { Component } from "react";
import "./ErrorBoundary.css";

/**
 * Catches render-time errors below it and shows a resettable fallback UI.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this._handleReset = this._handleReset.bind(this);
  }

  /**
   * Switch to fallback UI after a descendant throws during render.
   * @returns {{hasError: boolean}} Updated boundary state.
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * Log caught errors only during local development.
   * @param {Error} error - Caught render error.
   * @param {Object} info - React component stack details.
   */
  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, info);
    }
  }

  /**
   * Clear the fallback state so children can render again.
   */
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
