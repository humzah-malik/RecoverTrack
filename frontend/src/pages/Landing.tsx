import { Link } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"
import HRVWave from "../components/HRVWave"
import { LucideUserPlus, LucideMoon, LucideBarChart } from "lucide-react"
import checkinImg from "./screenshots/checkin.png"
import recoveryImg from "./screenshots/recovery.png"
import trendsImg from "./screenshots/trendsGraph.png"
import calendarImg from "./screenshots/calendar.png"
import volGraphImg from "./screenshots/volGraph.png"
import profileImg from "./screenshots/profile.png"

import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Navigation } from 'swiper/modules'
import 'swiper/css/navigation'

const coreFeatures = [
  {
    title: "Daily Check-ins",
    img: checkinImg,
    alt: "Daily check-ins screenshot",
    description: "Track how you feel every day."
  },
  {
    title: "Smart Recovery Score",
    img: recoveryImg,
    alt: "Recovery score banner",
    description: "Get a score based on your daily inputs."
  },
  {
    title: "Trends & Insights",
    img: trendsImg,
    alt: "Trends insight graph",
    description: "Visualize your health patterns over time."
  },
]

export default function Landing() {
  return (
    <main className="relative text-foreground
      bg-background
      bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_60%)]
      dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.02),transparent_60%)]">

      <HRVWave />

      {/* THEME TOGGLE */}
      <div className="absolute bottom-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 1. HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="flex items-center gap-3 mb-6">
          <i className="fas fa-wave-square text-4xl" />
          <span className="text-5xl font-bold">RecoverTrack</span>
        </div>
        <p className="text-xl max-w-xl mb-10">
          Track your recovery. Optimize your training.
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
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
      </section>

      {/* 2. CORE FEATURES (SLIDESHOW) */}
      <section className="pt-32 pb-32 px-6">
        <div className="glass-panel text-center">
          <h2 className="text-2xl font-semibold mb-14">Core Features</h2>
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
                <div className="card-base p-6 flex flex-col items-center">
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden  flex items-center justify-center">
                    <img
                      src={feature.img}
                      alt={feature.alt}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* 3. PEEK INSIDE THE APP */}
      <section className="pt-32 pb-32 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-14">Peek inside the app</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          <div className="card-base p-4">
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden  flex items-center justify-center">
              <img
                src={calendarImg}
                alt="Calendar view"
                className="w-full h-full object-contain"
                loading="lazy"
                draggable={false}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Daily training &amp; log overview</p>
          </div>
          <div className="card-base p-4">
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden  flex items-center justify-center">
              <img
                src={volGraphImg}
                alt="Volume graph"
                className="w-full h-full object-contain"
                loading="lazy"
                draggable={false}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Compare volume vs fatigue</p>
          </div>
          <div className="card-base p-4">
            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden  flex items-center justify-center">
              <img
                src={profileImg}
                alt="Profile card"
                className="w-full h-full object-contain"
                loading="lazy"
                draggable={false}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Custom goals and user profile</p>
          </div>
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
    </main>
  )
}