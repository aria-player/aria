import { useContext, useEffect } from "react";
import { ScrollContext } from "../contexts/ScrollContext";

export function useScrollDetection() {
  const { setScrollY } = useContext(ScrollContext);

  useEffect(() => {
    setScrollY(0);
  }, [setScrollY]);

  return { onScroll: setScrollY };
}
