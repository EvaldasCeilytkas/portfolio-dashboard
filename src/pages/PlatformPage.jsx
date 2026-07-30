import { Link, useParams } from "react-router-dom";

import PagePlaceholder from "../components/common/PagePlaceholder";

function PlatformPage() {
  const { platformSlug } = useParams();

  return (
    <PagePlaceholder
      label="PLATFORMOS MARŠRUTAS VEIKIA"
      title={platformSlug}
      description="Tai bendras PlatformPage komponentas. Atskiras CrowdpearPage.jsx nebus kuriamas."
      testId="platform-page"
    >
      <div className="route-preview">
        /platforms/{platformSlug}
      </div>

      <Link
        className="primary-link"
        to={`/platforms/${platformSlug}/projects/TEST-001`}
      >
        Patikrinti projekto maršrutą
      </Link>
    </PagePlaceholder>
  );
}

export default PlatformPage;
