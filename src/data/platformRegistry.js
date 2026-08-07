import platformList from "./platforms.json";

function normalizeOwners(platform) {
  const owners = Array.isArray(platform?.owners) && platform.owners.length
    ? platform.owners
    : ["evaldas"];

  return Object.freeze([...new Set(owners)]);
}

function freezePlatform(platform) {
  return Object.freeze({
    ...platform,
    owners: normalizeOwners(platform),
    ownerSources: Object.freeze({ ...(platform.ownerSources || {}) }),
  });
}

export const platforms = Object.freeze(
  Object.fromEntries(
    platformList.map((platform) => {
      const frozen = freezePlatform(platform);
      return [frozen.slug, frozen];
    }),
  ),
);

export const platformArray = Object.freeze(
  platformList.map((platform) => platforms[platform.slug]),
);

export function getPlatform(slug) {
  return platforms[slug] ?? null;
}

export function getEnabledPlatforms() {
  return platformArray.filter((platform) => platform.enabled !== false);
}

export function getPlatformsByGroup(group) {
  return getEnabledPlatforms().filter((platform) => platform.group === group);
}

export function getPlatformsByType(type) {
  return getEnabledPlatforms().filter((platform) => platform.type === type);
}

export function getOwnerPlatforms(ownerId = "evaldas") {
  if (ownerId === "family") {
    return getEnabledPlatforms();
  }

  return getEnabledPlatforms().filter((platform) =>
    platform.owners.includes(ownerId),
  );
}

export function isP2POverviewPlatform(platform) {
  return Boolean(
    platform &&
      (platform.group === "p2p" ||
        platform.group === "real_estate" ||
        platform.type === "npl"),
  );
}

export function getP2PPlatforms() {
  return getEnabledPlatforms().filter(isP2POverviewPlatform);
}

export function getOwnerP2PPlatforms(ownerId = "evaldas") {
  return getOwnerPlatforms(ownerId).filter(isP2POverviewPlatform);
}

export function hasPlatform(slug) {
  return Boolean(platforms[slug]);
}
