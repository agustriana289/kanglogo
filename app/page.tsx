import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import Featured from "@/components/Featured";
import Portfolio from "@/components/Portfolio";
import Reasons from "@/components/Reasons";
import Pricing from "@/components/Pricing";
import Steps from "@/components/Steps";
import CallToAction from "@/components/CallToAction";

const Video = dynamic(() => import("@/components/Video"), {
  loading: () => <div className="min-h-[400px]" />,
});

const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  loading: () => <div className="min-h-[400px]" />,
});

const FAQ = dynamic(() => import("@/components/FAQ"), {
  loading: () => <div className="min-h-[400px]" />,
});

const Blog = dynamic(() => import("@/components/Blog"), {
  loading: () => <div className="min-h-[400px]" />,
});

export default function Home() {
  return (
    <main>
      <Hero />
      <Featured />
      <Portfolio category="Logo" />
      <Testimonials />
      <Video />
      <Reasons />
      <Pricing />
      <FAQ showFeaturedOnly={true} />
      <Steps />
      <CallToAction />
      <Blog />
    </main>
  );
}
