import { Component, type ErrorInfo, type ReactNode } from "react";
import { StudioScreen } from "./components/screens/StudioScreen";

interface ErrorBoundaryState { hasError: boolean; message: string; }

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || "An unexpected application error occurred." };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Bedrock Creator Studio error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-dark-bg text-white grid place-items-center p-6">
          <section className="max-w-md glass rounded-2xl p-6 space-y-4">
            <h1 className="text-xl font-bold">Studio could not open</h1>
            <p className="text-sm text-gray-400">{this.state.message}</p>
            <button onClick={() => window.location.reload()} className="w-full rounded-xl bg-neon-purple p-3 font-semibold">Reload Studio</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <main className="min-h-screen bg-dark-bg text-gray-100 cyber-grid">
        <div className="mx-auto w-full max-w-xl px-4 pt-5 pb-10">
          <StudioScreen />
        </div>
      </main>
    </AppErrorBoundary>
  );
}
