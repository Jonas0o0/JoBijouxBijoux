import { StrictMode, Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "#f87171", background: "#020617", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#fbbf24" }}>
            ⚠️ ERPBijoux POS - Diagnostic d'erreur
          </h1>
          <p style={{ color: "#cbd5e1", marginBottom: "1rem" }}>
            L'interface a intercepté une exception lors du rendu :
          </p>
          <pre style={{ background: "#0f172a", color: "#fca5a5", padding: "1rem", borderRadius: "0.5rem", overflow: "auto", border: "1px solid #334155" }}>
            {this.state.error?.toString()}
            {"\n"}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem", background: "#d97706", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "bold" }}
          >
            Recharger la Caisse
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>
);
