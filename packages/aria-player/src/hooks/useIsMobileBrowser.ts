import { useEffect, useState } from "react";
import { isTauri } from "../app/utils";

const MOBILE_QUERY = "(max-width: 450px)";

export function useIsMobileBrowser(): boolean {
  const [isMobileBrowser, setIsMobileBrowser] = useState(
    () => !isTauri() && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    if (isTauri()) return;
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobileBrowser(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isMobileBrowser;
}
