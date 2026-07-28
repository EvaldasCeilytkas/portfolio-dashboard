import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import RealEstatePlatformProfile from "../components/realEstate/RealEstatePlatformProfile";
import RealEstateProjectProfile from "../components/realEstate/RealEstateProjectProfile";

const DATA_URL = "/data/crowdpear.json";

export default function Crowdpear() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
          throw new Error(`Nepavyko įkelti ${DATA_URL} (${response.status})`);
        }

        const payload = await response.json();
        if (!cancelled) setData(payload);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="re-page">
        <section className="re-card re-not-found">
          <h1>Nepavyko įkelti Crowdpear duomenų</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="re-page">
        <section className="re-card re-loading">Kraunami Crowdpear duomenys...</section>
      </main>
    );
  }

  return projectId
    ? <RealEstateProjectProfile data={data} />
    : <RealEstatePlatformProfile data={data} />;
}
