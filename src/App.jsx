import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Analytics from "./pages/Analytics";
import P2P from "./pages/P2P";
import Dividends from "./pages/Dividends";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import DataCenter from "./pages/DataCenter";
import PlatformProfile from "./pages/PlatformProfile";
import EtfProfile from "./pages/EtfProfile";
import P2PLoanProfile from "./pages/P2PLoanProfile";
import P2PPlatformProfile from "./pages/P2PPlatformProfile";
import NplPlatformProfile from "./pages/NplPlatformProfile";
import NplProjectProfile from "./pages/NplProjectProfile";
import Crowdpear from "./pages/Crowdpear";
import Profitus from "./pages/Profitus";
import Rontgen from "./pages/Rontgen";
import Nordstreet from "./pages/Nordstreet";

import "./styles/sidebar.css";
import "./styles/dashboard.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />

          <Route path="/platforms/indemo" element={<NplPlatformProfile />} />

          <Route path="/platforms/crowdpear" element={<Crowdpear />} />
          <Route
            path="/platforms/crowdpear/project/:projectId"
            element={<Crowdpear />}
          />

          <Route path="/platforms/profitus" element={<Profitus />} />
          <Route
            path="/platforms/profitus/project/:projectId"
            element={<Profitus />}
          />

          <Route path="/platforms/rontgen" element={<Rontgen />} />
          <Route
            path="/platforms/rontgen/project/:projectId"
            element={<Rontgen />}
          />

          <Route path="/platforms/nordstreet" element={<Nordstreet />} />
          <Route
            path="/platforms/nordstreet/project/:projectId"
            element={<Nordstreet />}
          />

          <Route
            path="/platforms/afranga"
            element={<P2PPlatformProfile />}
          />
          <Route
            path="/platforms/debitum"
            element={<P2PPlatformProfile />}
          />

          <Route path="/platforms/:slug" element={<PlatformProfile />} />

          <Route
            path="/platforms/:slug/position/:ticker"
            element={<EtfProfile />}
          />
          <Route
            path="/platforms/:slug/loan/:loanId"
            element={<P2PLoanProfile />}
          />
          <Route
            path="/platforms/:slug/project/:projectId"
            element={<NplProjectProfile />}
          />

          <Route path="/analytics" element={<Analytics />} />
          <Route path="/p2p" element={<P2P />} />
          <Route path="/dividends" element={<Dividends />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<DataCenter />} />
          <Route path="/data-center" element={<DataCenter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
