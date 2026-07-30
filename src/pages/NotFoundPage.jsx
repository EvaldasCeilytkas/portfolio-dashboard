import { Link } from "react-router-dom";

import PagePlaceholder from "../components/common/PagePlaceholder";

function NotFoundPage() {
  return (
    <PagePlaceholder
      label="404"
      title="Puslapis nerastas"
      description="Patikrink adresą arba grįžk į pagrindinį Dashboard puslapį."
      testId="not-found-page"
    >
      <Link className="primary-link" to="/">
        Grįžti į Dashboard
      </Link>
    </PagePlaceholder>
  );
}

export default NotFoundPage;
