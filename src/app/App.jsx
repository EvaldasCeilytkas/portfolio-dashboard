import { PortfolioProvider } from "../context/PortfolioContext";
import AppRoutes from "./routes";

function App() {
  return (
    <PortfolioProvider>
      <AppRoutes />
    </PortfolioProvider>
  );
}

export default App;
