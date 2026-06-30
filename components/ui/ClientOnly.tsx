"use client";

import { useEffect, useState } from "react";

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        setHasMounted(true);
      }
    }, 0);
    return () => {
      active = false;
    };
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
