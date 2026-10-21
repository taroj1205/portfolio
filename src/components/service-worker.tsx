"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const ServiceWorker = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.controller?.postMessage(
        `${pathname}${location.search}`
      );
    }
  }, [pathname]);

  return null;
};
