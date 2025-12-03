// src/app/page.tsx
import Hero from "@/components/Hero";
import Featured from "@/components/Featured";
import Portfolio from "@/components/Portfolio";
import Testimonials from "@/components/Testimonials";
import Video from "@/components/Video";
import Reasons from "@/components/Reasons";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Steps from "@/components/Steps";
import CallToAction from "@/components/CallToAction";
import Blog from "@/components/Blog";

export default function Home() {
  return (
    <main>
      <Hero />
      <Featured />
      <Portfolio />
      <Testimonials />
      <Video />
      <Reasons />
      <Pricing />
      <FAQ />
      <Steps />
      <CallToAction />
      <Blog />
    </main>
  );
}
