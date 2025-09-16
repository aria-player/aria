import React, { createContext, useState } from "react";

export const ScrollContext = createContext<{
  scrollY: number;
  setScrollY: (value: number) => void;
}>({
  scrollY: 0,
  setScrollY: () => {}
});

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [scrollY, setScrollY] = useState(0);

  return (
    <ScrollContext.Provider value={{ scrollY, setScrollY }}>
      {children}
    </ScrollContext.Provider>
  );
};
