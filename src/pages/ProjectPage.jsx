import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import RealEstateProjectProfile from "../components/realEstate/RealEstateProjectProfile";
import IndemoClaimProfile from "../components/indemo/IndemoClaimProfile";
import BrokerageInvestmentProfile from "../components/brokerage/BrokerageInvestmentProfile";
import RoboInvestmentProfile from "../components/robo/RoboInvestmentProfile";
import FundInvestmentProfile from "../components/funds/FundInvestmentProfile";

function ProjectPage() {
  const { platformSlug, projectCode } = useParams();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProject() {
      try {
        setPayload(null);
        setError("");

        const response = await fetch(
          `${import.meta.env.BASE_URL}data/platforms/${platformSlug}.json`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Platformos JSON: HTTP ${response.status}`);
        }

        setPayload(await response.json());
      } catch (err) {
        if (err?.name !== "AbortError") {
          setError(err?.message || "Nepavyko įkelti projekto.");
        }
      }
    }

    loadProject();
    return () => controller.abort();
  }, [platformSlug]);

  const project = useMemo(() => {
    const decoded = decodeURIComponent(String(projectCode || ""));
    const projects = Array.isArray(payload?.investments)
      ? payload.investments
      : Array.isArray(payload?.projects)
        ? payload.projects
        : [];

    return projects.find((item) =>
      [item.code, item.id, item.slug, item.name]
        .filter(Boolean)
        .map(String)
        .includes(decoded),
    );
  }, [payload, projectCode]);

  if (error) {
    return (
      <main className="re-page">
        <section className="re-card re-not-found">
          <h1>Projekto nepavyko įkelti</h1>
          <p>{error}</p>
          <Link to={`/platforms/${platformSlug}`}>
            ← Grįžti į platformą
          </Link>
        </section>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="re-page">
        <div className="re-loading">Kraunami projekto duomenys…</div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="re-page">
        <section className="re-card re-not-found">
          <h1>Projektas nerastas</h1>
          <p>Patikrink projekto nuorodą arba platformos JSON.</p>
          <Link to={`/platforms/${platformSlug}`}>
            ← Grįžti į platformą
          </Link>
        </section>
      </main>
    );
  }

  const isIndemo =
    payload?.moduleType === "indemo" ||
    payload?.platform?.type === "indemo";

  if (isIndemo) {
    return (
      <IndemoClaimProfile
        platform={payload.platform || { slug: platformSlug }}
        claim={project}
      />
    );
  }

  const isBrokerage =
    payload?.platform?.group === "brokerage" ||
    payload?.platform?.type === "brokerage";

  if (isBrokerage) {
    return (
      <BrokerageInvestmentProfile
        platform={payload.platform || { slug: platformSlug }}
        investment={project}
        summary={payload.summary || {}}
      />
    );
  }

  const isRobo =
    payload?.platform?.group === "robo" ||
    payload?.platform?.type === "robo-advisor";

  if (isRobo) {
    return (
      <RoboInvestmentProfile
        platform={payload.platform || { slug: platformSlug }}
        investment={project}
      />
    );
  }

  const isFunds =
    payload?.platform?.group === "funds" ||
    payload?.platform?.type === "funds";

  if (isFunds) {
    return (
      <FundInvestmentProfile
        platform={payload.platform || { slug: platformSlug }}
        investment={project}
      />
    );
  }

  return (
    <RealEstateProjectProfile
      platform={payload.platform || { slug: platformSlug }}
      project={project}
    />
  );
}

export default ProjectPage;
