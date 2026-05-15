import Script from "next/script";

import { AdSlot } from "@/features/ads/ad-slot";

import { Hero } from "./_components/hero";
import { Features } from "./_components/features";
import { HowItWorks } from "./_components/how-it-works";
import { Testimonials } from "./_components/testimonials";
import { FrequentlyAsked } from "./_components/frequently-asked";

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const slotAfterHero = process.env.NEXT_PUBLIC_ADSENSE_SLOT_AFTER_HERO;
const slotMidPage = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID_PAGE;
const slotBeforeFaq = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BEFORE_FAQ;

export default function HomePage() {
  return (
    <div>
      {adsenseClientId ? (
        <Script
          id="adsbygoogle-js"
          strategy="lazyOnload"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
        />
      ) : null}

      <Hero />

      {/* Ad slot 1: below hero / above features (high visibility after primary CTA) */}
      <AdSlot slotId={slotAfterHero} />

      <Features />

      <HowItWorks />

      {/* Ad slot 2: mid-page between how-it-works and social proof */}
      <AdSlot slotId={slotMidPage} />

      <Testimonials />

      {/* Ad slot 3: before FAQ / above footer content */}
      <AdSlot slotId={slotBeforeFaq} />

      <FrequentlyAsked />
    </div>
  );
}
