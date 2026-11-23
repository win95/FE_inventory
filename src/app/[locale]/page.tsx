import Hero from "@/components/Hero";
import StatsStrip from "@/components/StatsStrip";
import LocationIntelligence from "@/components/LocationIntelligence";
import HowItWorks from "@/components/HowItWorks";
import LeadForm from "@/components/LeadForm";
import Reveal from "@/components/motion/Reveal";

// Home Public (F01–F05, F12): Menu + Hero/Search bar + dải số liệu +
// heatmap + How AWING Works + Lead form. Footer và Contact Us nằm ở layout
// và route /contact. Mọi số liệu đều qua API backend — xem src/lib/api.ts.
// Ba khối giữa bọc Reveal (FE 10): hiện dần khi cuộn tới, tắt khi bật
// giảm chuyển động; không có JS thì nội dung vẫn hiện (Reveal mặc định hiện).
export default function Home() {
  return (
    <main>
      <Hero />
      <Reveal>
        <StatsStrip />
      </Reveal>
      <Reveal>
        <LocationIntelligence />
      </Reveal>
      <Reveal>
        <HowItWorks />
      </Reveal>
      <LeadForm />
    </main>
  );
}
