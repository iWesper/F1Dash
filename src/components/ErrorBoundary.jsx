import React from "react";
import { State } from "./State";

/**
 * Reusable error boundary.
 *
 * React only catches render errors via class components with
 * getDerivedStateFromError / componentDidCatch. Wrap a section of the tree so
 * a failure shows a fallback instead of crashing the whole app.
 *
 * Props:
 *  - label:    section name, used in the default message.
 *  - fallback: optional React element to replace the default message.
 *  - resetKey: when this changes (e.g. the route), the boundary resets.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, info) {
    console.error(`ErrorBoundary${this.props.label ? ` (${this.props.label})` : ""}:`, error, info);
  }

  handleReset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const { label } = this.props;
    return (
      <section className="panel">
        <State
          kind="error"
          title={label ? `Couldn't show ${label}` : "Something went wrong"}
          action={{ label: "Try again", onClick: this.handleReset }}
        >
          This part of the page hit an unexpected error. The rest of the app still works.
        </State>
      </section>
    );
  }
}

export default ErrorBoundary;
