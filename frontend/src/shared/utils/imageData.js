export function getBase64Pure(base64String) {
  if (!base64String) return null;
  const parts = base64String.split(',');
  return parts.length > 1 ? parts[1] : base64String;
}

export function getDataURI(pureBase64) {
  if (!pureBase64) return null;
  if (pureBase64.startsWith('data:')) return pureBase64;
  return `data:image/jpeg;base64,${pureBase64}`;
}
