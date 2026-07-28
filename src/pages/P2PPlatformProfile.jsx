import { useLocation } from "react-router-dom";
import PlatformProfile from "./PlatformProfile";

function getSlugFromPath(pathname) {
  const parts = String(pathname || "")
    .split("/")
    .filter(Boolean);

  const platformIndex = parts.indexOf("platforms");

  if (platformIndex === -1) {
    return "";
  }

  return parts[platformIndex + 1] || "";
}

export default function P2PPlatformProfile() {
  const location = useLocation();
  const slug = getSlugFromPath(location.pathname);

  return <PlatformProfile slugOverride={slug} />;
}
