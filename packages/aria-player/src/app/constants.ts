export const BASEPATH = import.meta.env.BASE_URL || "/";

// eslint-disable-next-line @typescript-eslint/no-deprecated
export const IS_MAC_LIKE = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)
  ? true
  : false;
