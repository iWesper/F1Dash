import React from "react";

/**
 * Reusable error boundary.
 *
 * React only catches render errors via class components with
 * getDerivedStateFromError / componentDidCatch. Wrap a section of the tree so
 * a failure (e.g. a broken API) shows a fallback instead of crashing the whole
 * app (white screen).
 *
 * Props:
 *  - label:    section name, used in the default message.
 *  - fallback: optional React element to replace the default message.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production this would be forwarded to a logging service.
    console.error(`ErrorBoundary${this.props.label ? ` (${this.props.label})` : ""}:`, error, info);
  }

  handleReset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const { label } = this.props;
    return (
      <div className="box p-4 text-center text-white">
        <h2 className="fw-bold">
          {label ? `Couldn't load ${label}.` : "Something went wrong here."}
        </h2>
        <p className="mb-3">
          This section failed to render — the rest of the app should still work.
        </p>
        <button className="btn btn-outline-light" onClick={this.handleReset}>
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
