const sortCache: { [key: string]: number } = {};

export const compareMetadata = (
  valueA: string[] | string | number | boolean | undefined,
  valueB: string[] | string | number | boolean | undefined,
  isDescending?: boolean
): number => {
  const order = isDescending ? -1 : 1;
  const cacheKey = `${valueA}-${valueB}-${isDescending}`;
  if (sortCache[cacheKey] !== undefined) return sortCache[cacheKey];

  if (valueA == null && valueB == null) return (sortCache[cacheKey] = 0);
  if (valueA == null) return (sortCache[cacheKey] = 1 * order);
  if (valueB == null) return (sortCache[cacheKey] = -1 * order);

  if (Array.isArray(valueA)) valueA = valueA.length > 0 ? valueA[0] : "";
  if (Array.isArray(valueB)) valueB = valueB.length > 0 ? valueB[0] : "";

  if (typeof valueA === "string" && typeof valueB === "string") {
    return (sortCache[cacheKey] =
      valueA.localeCompare(valueB, undefined, {
        sensitivity: "base",
        ignorePunctuation: true
      }) * order);
  }

  if (typeof valueA === "number" && typeof valueB === "number") {
    return (sortCache[cacheKey] = (valueA - valueB) * order);
  }

  return (sortCache[cacheKey] = 0);
};
