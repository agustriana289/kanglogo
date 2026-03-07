import FadeIn from "./FadeIn";
import DynamicIcon from "../DynamicIcon";

const defaultSteps = [
  {
    id: "01",
    name: "Discovery",
    description: "Fill out a quick brief about your brand's vision, target audience, and style preferences.",
    icon: "MessageSquareText",
  },
  {
    id: "02",
    name: "Ideation",
    description: "Our expert designers craft multiple unique, initial logo concepts within 24-48 hours.",
    icon: "PenTool",
  },
  {
    id: "03",
    name: "Refinement",
    description: "We work closely with you to tweak, revise, and perfect your chosen design direction.",
    icon: "RefreshCw",
  },
  {
    id: "04",
    name: "Delivery",
    description: "Receive all your high-res, vector, and source files ready for web and print.",
    icon: "Send",
  },
];

export default function Steps({ settings }: { settings?: any }) {
  const stepsList = settings?.process_list && settings.process_list.length > 0
    ? settings.process_list.map((step: any, i: number) => ({ ...step, id: `0${i + 1}`.slice(-2), name: step.title, description: step.desc }))
    : defaultSteps;
  return (
    <section className="bg-slate-50 py-24 sm:py-32 overflow-hidden" id="process">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100} className="mx-auto max-w-2xl text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-4">
            <span>{settings?.process_badge || "Our Process"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {settings?.process_title || "4 simple steps to launch"}
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            {settings?.process_description || "We've eliminated the friction from traditional agency models. Here is how we deliver world-class identities so quickly."}
          </p>
        </FadeIn>

        <div className="relative z-10">
          {/* Connecting Line for Desktop */}
          <div className="hidden lg:block absolute top-14 left-8 w-[calc(100%-4rem)] h-px bg-linear-to-r from-indigo-100 via-indigo-200 to-indigo-100 -z-10"></div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
            {stepsList.map((step: any, idx: number) => (
              <FadeIn key={idx} delay={150 + idx * 150} className="relative group">
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  {/* Icon & Number Circle */}
                  <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-white ring-8 ring-slate-50 border border-slate-100 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:border-indigo-200 group-hover:shadow-md mb-6 z-10">
                    <DynamicIcon name={step.icon} size={32} className="text-indigo-600 transition-colors duration-300 group-hover:text-indigo-500" />
                    {/* Background faint number */}
                    <span className="absolute -bottom-2 -right-2 text-5xl font-extrabold text-slate-100 group-hover:text-indigo-50 transition-colors duration-500 -z-10 select-none">
                      {step.id}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
                    Step {parseInt(step.id)}: {step.name}
                  </h3>
                  <p className="text-slate-600 leading-relaxed max-w-sm">
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
