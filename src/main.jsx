import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./app/App";
import "./styles/design-system/index.css";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/portfolio-dashboard">
      <App />
    </BrowserRouter>
  </StrictMode>,
);
