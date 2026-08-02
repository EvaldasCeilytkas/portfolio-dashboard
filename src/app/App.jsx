import AppErrorBoundary from "../components/common/AppErrorBoundary";
import { ToastProvider } from "../components/ui/Toast";
import { PortfolioProvider } from "../context/PortfolioContext";
import AppRoutes from "./routes";

function App() {
  return (
    <AppErrorBoundary>
      <PortfolioProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </PortfolioProvider>
    </AppErrorBoundary>
  );
}

export default App;
