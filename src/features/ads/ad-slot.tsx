import { AdSenseBanner } from "@/features/ads/adsense-banner";
import { cn } from "@/lib/utils";

type AdSlotProps = {
  /** Ad unit slot ID from Google AdSense (numeric string). */
  slotId: string | undefined;
  className?: string;
};

/**
 * Renders a horizontal ad region when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` and a slot
 * ID are configured; otherwise renders nothing (safe for local dev).
 */
export function AdSlot({ slotId, className }: AdSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (!clientId || !slotId) {
    return null;
  }

  return (
    <aside
      className={cn(
        "border-border/60 bg-background/80 flex justify-center border-y py-6 backdrop-blur-sm",
        className
      )}
      aria-label="Advertisement"
    >
      <div className="container mx-auto w-full max-w-5xl px-4">
        <AdSenseBanner clientId={clientId} slotId={slotId} />
      </div>
    </aside>
  );
}
