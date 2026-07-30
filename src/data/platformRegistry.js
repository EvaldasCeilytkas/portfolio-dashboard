import platformList from "./platforms.json";

export const platforms = Object.freeze(
  Object.fromEntries(
    platformList.map((platform) => [platform.slug, Object.freeze(platform)]),
  ),
);

export const platformArray = Object.freeze(
  platformList.map((platform) => platforms[platform.slug]),
);

export function getPlatform(slug) {
  return platforms[slug] ?? null;
}

export function getEnabledPlatforms() {
  return platformArray.filter((platform) => platform.enabled);
}

export function getPlatformsByGroup(group) {
  return getEnabledPlatforms().filter((platform) => platform.group === group);
}

export function getPlatformsByType(type) {
  return getEnabledPlatforms().filter((platform) => platform.type === type);
}

export function hasPlatform(slug) {
  return Boolean(platforms[slug]);
}
