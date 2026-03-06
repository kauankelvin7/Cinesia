// Utilitário para remover undefined recursivamente de objetos
export const cleanUndefined = (obj) => {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        typeof v === 'object' && v !== null && !v?.toDate
          ? cleanUndefined(v)
          : v
      ])
  );
};
