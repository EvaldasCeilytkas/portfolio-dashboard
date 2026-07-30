import { Link } from "react-router-dom";

import PagePlaceholder from "../components/common/PagePlaceholder";

function P2PPage() {
  return (
    <PagePlaceholder
      label="V2.0"
      title="P2P puslapis prijungtas"
      description="Crowdpear platformą kursime tik užbaigę pagrindinį Dashboard etapą."
      testId="p2p-page"
    >
      <Link className="primary-link" to="/platforms/crowdpear">
        Patikrinti Crowdpear maršrutą
      </Link>
    </PagePlaceholder>
  );
}

export default P2PPage;
