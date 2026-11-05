import Image from "next/image"
import Link from "next/link"
import { applicationTabs } from "@/lib/application-tabs"

export default function HomePage() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center overflow-hidden border-t-[10px] border-[#FFCC29] bg-[linear-gradient(110deg,#393939,#222222)] px-5 pb-16 pt-14 text-white sm:px-10 sm:pt-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,#111111_2px,transparent_3px)] bg-[length:36px_36px] opacity-40" />
      <svg aria-hidden="true" viewBox="0 0 1440 460" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-[8%] -z-10 h-[60%] w-full text-white/10">
        {Array.from({ length: 22 }, (_, index) => (
          <path
            key={index}
            d={`M0 ${285 + index * 4} C380 ${515 - index * 3} 490 ${140 + index * 5} 815 ${190 + index * 4} S1220 ${410 + index} 1440 ${55 + index * 14}`}
            fill="none"
            stroke="currentColor"
          />
        ))}
      </svg>

      <Image src="/avapex-logo.png" alt="Avapex Transportes" width={540} height={166} unoptimized className="mb-5 h-auto w-48 sm:w-64" />
      <h1 className="text-center text-3xl font-extrabold uppercase tracking-tight sm:text-5xl">
        Calculadora de Carga
      </h1>

      <nav aria-label="Abas da calculadora" className="my-auto grid w-full max-w-3xl grid-cols-2 gap-3 py-16 sm:grid-cols-4 sm:gap-5">
        {applicationTabs.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-36 flex-col items-center rounded-xl px-3 py-5 text-center text-[#FFCC29] transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFCC29]"
          >
            <Icon aria-hidden="true" className="mb-4 size-11" strokeWidth={1.35} />
            <span className="w-full border-t border-current pt-3 text-base font-semibold sm:text-lg">{label}</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}
