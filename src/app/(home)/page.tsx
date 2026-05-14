import HomePage from "./page-content";

import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.home");

  return {
    title: siteConfig.name,
    description: t("description"),
  };
}

export default HomePage;
