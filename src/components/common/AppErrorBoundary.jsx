import { Component } from "react";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Portfolio Dashboard klaida", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="rc-error-boundary">
        <div className="rc-error-card">
          <span className="rc-error-code">STABLE</span>
          <h1>Puslapio parodyti nepavyko</h1>
          <p>{this.state.error?.message || "Įvyko netikėta aplikacijos klaida."}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Perkrauti aplikaciją
          </button>
        </div>
      </main>
    );
  }
}

export default AppErrorBoundary;
