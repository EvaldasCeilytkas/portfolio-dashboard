import { Link, useParams } from "react-router-dom";

import PagePlaceholder from "../components/common/PagePlaceholder";

function ProjectPage() {
  const { platformSlug, projectCode } = useParams();

  return (
    <PagePlaceholder
      label="PROJEKTO MARŠRUTAS VEIKIA"
      title={projectCode}
      description="Projektas bus ieškomas pagal code reikšmę. Skaitinio id navigacijai nenaudosime."
      testId="project-page"
    >
      <div className="route-preview">
        /platforms/{platformSlug}/projects/{projectCode}
      </div>

      <Link className="primary-link is-secondary" to={`/platforms/${platformSlug}`}>
        Grįžti į platformą
      </Link>
    </PagePlaceholder>
  );
}

export default ProjectPage;
