"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavProgressContextType {
  isNavigating: boolean;
  startNavTransition: (callback: () => void) => void;
  pendingHref: string | null;
  setPendingHref: (href: string | null) => void;
}

const NavProgressContext = createContext<NavProgressContextType>({
  isNavigating: false,
  startNavTransition: () => {},
  pendingHref: null,
  setPendingHref: () => {},
});

export function NavProgressProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
  const [prevPath, setPrevPath] = useState(currentPath);

  if (prevPath !== currentPath) {
    setPrevPath(currentPath);
    if (pendingHref !== null) {
      setPendingHref(null);
    }
  }

  function startNavTransition(callback: () => void) {
    startTransition(() => {
      callback();
    });
  }

  return (
    <NavProgressContext.Provider
      value={{
        isNavigating,
        startNavTransition,
        pendingHref,
        setPendingHref,
      }}
    >
      {/* Top slim progress indicator for immediate feedback */}
      {(isNavigating || pendingHref) && (
        <div
          role="progressbar"
          aria-label="Loading page content"
          className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-emerald-100 overflow-hidden"
        >
          <div className="h-full bg-emerald-600 w-full animate-progress-indeterminate shadow-xs" />
        </div>
      )}
      {children}
    </NavProgressContext.Provider>
  );
}

export function useNavProgress() {
  return useContext(NavProgressContext);
}
