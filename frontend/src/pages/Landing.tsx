import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
// import HRVWave from "../components/HRVWave";
import { LucideUserPlus, LucideMoon, LucideBarChart } from "lucide-react";
import { useEffect, useState } from "react";

import checkinImg from "./screenshots/checkin.png";
import recoveryImg from "./screenshots/recovery.png";
import trendsImg from "./screenshots/trendsGraph.png";
import calendarImg from "./screenshots/calendar.png";
import volGraphImg from "./screenshots/volGraph.png";
import profileImg from "./screenshots/profile.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import BackgroundEffects from "../components/BackgroundEffects";
import BackgroundGradient from "../components/BackgroundGradient";

const coreFeatures = [
  {
    title: "Daily Check-ins",
    img: checkinImg,
    alt: "Daily check-ins screenshot",
    description: "Track how you feel every day.",
  },
  {
    title: "Smart Recovery Score",
    img: recoveryImg,
    alt: "Recovery score banner",
    description: "Get a score based on your daily inputs.",
  },
  {
    title: "Trends & Insights",
    img: trendsImg,
    alt: "Trends insight graph",
    description: "Visualize your health patterns over time.",
  },
];

export default function Landing() {

  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setTimeout(() => setShowScrollIndicator(false), 3000);
      }
    };
  
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);  

  return (
    <main className="relative z-[10] text-foreground bg-transparent overflow-hidden">
      {/* <SiteBackground /> */}
      {/* THEME TOGGLE */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <BackgroundEffects />
        <BackgroundGradient />
      </div>
      <div className="relative z-10">
      <div className="absolute bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 1. HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative">
        
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-3 mb-6">
              <i className="fas fa-wave-square text-4xl text-[#00b894] dark:text-[#d6b370]" />
              <span className="text-5xl font-bold">RecoverTrack</span>
            </div>
            <p className="text-xl max-w-xl mb-10">
              Track your recovery. Optimize your training.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 mb-10">
              <Link
                to="/auth/login"
                className="btn w-44 text-white font-semibold shadow-md"
                style={{
                  ["--btn-bg" as any]: "#00b894",
                  ["--btn-border" as any]: "#00b894",
                }}
              >
                Log In
              </Link>
              <Link
                to="/auth/register"
                className="btn w-44 text-white font-semibold shadow-md"
                style={{
                  ["--btn-bg" as any]: "#d6b370",
                  ["--btn-border" as any]: "#d6b370",
                }}
              >
                Register
              </Link>
            </div>
          </div>

          {/* Scroll Mouse Indicator */}
          {showScrollIndicator && (
            <div
              className="absolute bottom-10 left-1/2 transform -translate-x-1/2 group cursor-pointer z-40 flex flex-col items-center"
              onClick={() => {
                document
                  .querySelector("#core-features")
                  ?.scrollIntoView({ behavior: "smooth" });
                  setTimeout(() => setShowScrollIndicator(false), 3000);
              }}
            >
              <div className="w-7 h-12 border-2 border-muted rounded-full flex justify-center items-start relative overflow-hidden shadow-glow">
                <div className="w-2 h-2 bg-muted rounded-full mt-2 animate-scroll-dot" />
              </div>
              <span className="mt-2 text-xs tracking-widest text-muted animate-pulse-soft">
                SCROLL
              </span>
            </div>
          )}
        </section>

      {/* 2. CORE FEATURES (SLIDESHOW) */}
      <section id="core-features" className="pt-28 pb-28 px-6">
        <h2 className="text-2xl font-semibold mb-10 text-center mx-auto">
          Core Features
        </h2>

        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000 }}
          spaceBetween={30}
          slidesPerView={1}
          className="w-full max-w-2xl mx-auto"
        >
          {coreFeatures.map((feature, index) => (
            <SwiperSlide key={index}>
              <div className="card-base p-6 pb-10 flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-3 text-center">
                  {feature.title}
                </h3>
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={feature.img}
                    alt={feature.alt}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    draggable={false}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground text-center">
                  {feature.description}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* 3. PEEK INSIDE THE APP */}
      <section className="pt-32 pb-32 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-14">Peek inside the app</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[calendarImg, volGraphImg, profileImg].map((img, i) => (
            <div key={i} className="card-base p-4">
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={img}
                  alt={`App preview ${i}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  draggable={false}
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {i === 0
                  ? "Daily training & log overview"
                  : i === 1
                  ? "Compare volume vs fatigue"
                  : "Custom goals and user profile"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="pt-32 pb-32 px-6">
        <div className="glass-panel text-center">
          <h2 className="text-2xl font-semibold mb-14">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card-base py-10 px-6 flex flex-col items-center gap-4">
              <LucideUserPlus className="w-8 h-8 text-primary" />
              <h3 className="font-medium">Create an account</h3>
            </div>
            <div className="card-base py-10 px-6 flex flex-col items-center gap-4">
              <LucideMoon className="w-8 h-8 text-primary" />
              <h3 className="font-medium">Log sleep &amp; workouts</h3>
            </div>
            <div className="card-base py-10 px-6 flex flex-col items-center gap-4">
              <LucideBarChart className="w-8 h-8 text-primary" />
              <h3 className="font-medium">Act on insights</h3>
            </div>
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}