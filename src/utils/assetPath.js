// Asset path helper — handles basePath for GitHub Pages
// In dev: /images/logo.jpg
// In prod: /celikminda/images/logo.jpg

const basePath = process.env.NODE_ENV === 'production' ? '/celikminda' : '';

export function assetPath(path) {
  if (!path) return path;
  // Already prefixed or external URL
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith(basePath + '/')) {
    return path;
  }
  // Ensure leading slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
}

// For CSS background-image url()
export function assetUrl(path) {
  return `url(${assetPath(path)})`;
}

export { basePath };
