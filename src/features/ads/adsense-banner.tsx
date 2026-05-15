"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSenseBannerProps = {
  clientId: string;
  slotId: string;
  className?: string;
};

/**
 * Single responsive AdSense display unit. Each instance needs its own ad unit
 * slot ID from the AdSense console.
 */
export function AdSenseBanner({
  clientId,
  slotId,
  className,
}: AdSenseBannerProps) {
  const pushedRef = React.useRef(false);

  React.useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense:", error);
    }
  }, []);

  return (
    <div
      className={cn(
        "flex min-h-[90px] w-full max-w-full justify-center overflow-hidden sm:min-h-[100px]",
        className
      )}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
