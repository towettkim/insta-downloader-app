import React from "react";

import { useTranslations } from "next-intl";

import { ArrowDown } from "lucide-react";

import { homeLinks, homeSections } from "@/lib/constants";
import { InstagramForm } from "@/components/instagram-form";

export function Hero() {
  const t = useTranslations("pages.home.hero");

  return (
    <section
      id={homeSections.hero}
      className="gradient-background w-full scroll-mt-16 py-12 md:py-24 lg:py-32 xl:py-48"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center space-y-6 text-center text-white">
          <div className="max-w-4xl space-y-4 text-balance">
            <h1 className="text-3xl font-bold tracking-tight drop-shadow-sm sm:text-4xl md:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/95 md:text-xl">
              {t("description")}
            </p>
          </div>
          <InstagramForm className="w-full max-w-3xl" variant="hero" />
          <div className="mt-4">
            <a
              href={homeLinks.howItWorks}
              className="inline-block text-white/90 transition-colors hover:text-white"
            >
              <div className="mb-2 hover:underline">{t("learnMore")}</div>
              <ArrowDown className="mx-auto h-6 w-6 animate-bounce text-white" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
