import React from "react";

/**
 * Limite de erro (error boundary) reutilizável.
 *
 * O React só apanha erros de renderização através de componentes de classe com
 * getDerivedStateFromError / componentDidCatch. Envolve uma secção da árvore para
 * que uma falha (ex.: uma API em baixo) mostre um fallback em vez de rebentar a app
 * inteira (ecrã branco).
 *
 * Props:
 *  - label:    nome da secção, usado na mensagem por omissão.
 *  - fallback: elemento React opcional para substituir a mensagem por omissão.
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
    // Em produção, isto seria enviado para um serviço de logging.
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
