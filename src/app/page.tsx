import { LedgerApp } from "@/components/LedgerApp";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Shore Ledger",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript. Works offline as a PWA.",
  description:
    "Local-first session cash and bank habit tracker. Log pocket vs bank, banked-before-risk habit score, and streak — self-report only, no game hooks.",
  url: "https://cash.neongulf.com",
  creator: {
    "@type": "Organization",
    name: "NeonGulf",
    url: "https://neongulf.com",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function Home() {
  return (
    <main className="animate-rise flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LedgerApp />
    </main>
  );
}
