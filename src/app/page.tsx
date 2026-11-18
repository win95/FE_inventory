import Hero from "@/components/Hero";
import StatsStrip from "@/components/StatsStrip";
import LocationIntelligence from "@/components/LocationIntelligence";
import HowItWorks from "@/components/HowItWorks";
import LeadForm from "@/components/LeadForm";

// Home Public (F01–F05, F12): Menu + Hero/Search bar + dải số liệu +
// heatmap + How AWING Works + Lead form. Footer và Contact Us nằm ở layout
// và route /contact. Mọi số liệu đều qua API backend — xem src/lib/api.ts.
export default function Home() {
  return (
    <main>
      <Hero />
      <StatsStrip />
      <LocationIntelligence />
      <HowItWorks />
      <LeadForm />
    </main>
  );
}
