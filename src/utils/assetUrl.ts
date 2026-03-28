const ABSOLUTE_URL_PATTERN = /^(?:[a-z]+:)?\/\//i;

export function assetUrl(path: string): string {
  if (
    !path ||
    ABSOLUTE_URL_PATTERN.test(path) ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}
