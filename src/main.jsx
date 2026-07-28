import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/theme.css";
import App from "./App.jsx";
import "./index.css";

import { PortfolioProvider } from "./context/PortfolioContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PortfolioProvider>
      <App />
    </PortfolioProvider>
  </StrictMode>
);