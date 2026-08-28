import Image from "next/image";

/*
  ==================================================================
  SURKH — Landing / Hero Page
  ==================================================================
  This mirrors index.html exactly (same Tailwind classes + tokens
  from tailwind.config.js), just written as a proper Next.js
  component using next/image for the pictures.

  WHERE TO PUT YOUR IMAGES:
  - Logo:            public/assets/logo.jpg   (swap for your own file)
  - Hero background: public/assets/hero-map-bg.png
  Next.js serves anything inside /public at the site root, so
  "/assets/logo.jpg" below points at public/assets/logo.jpg.
  ==================================================================
*/

export default function Home() {
  return (
    <>
      {/* ============================================================
          TOP ANNOUNCEMENT BAR
          ============================================================ */}
      <div className="bg-primary text-background">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 font-heading font-semibold text-sm sm:text-base hover:opacity-90 transition"
          >
            Download Our App
            <ArrowRightIcon />
          </a>
        </div>
      </div>

      {/* ============================================================
          HEADER / NAVBAR
          ============================================================ */}
      <header className="bg-background border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/*
              LOGO
              Replace public/assets/logo.jpg with your own logo file
              (ideally a transparent PNG/SVG). Update the filename
              here if you rename it.
            */}
            <Image
              src="/assets/logo.jpg"
              alt="Surkh logo: hourglass with a blood drop and medical cross"
              width={64}
              height={117}
              className="h-14 sm:h-16 w-auto"
              priority
            />

            <div>
              <h1 className="font-heading font-extrabold text-primary text-3xl sm:text-4xl leading-none tracking-tight">
                SURKH
              </h1>
              {/* Tagline: width-capped + tighter tracking so it never runs wider than "SURKH" above it */}
              <p className="font-heading text-[9px] sm:text-[10px] tracking-tight text-textcol mt-1 max-w-[110px] sm:max-w-[140px] leading-tight">
                CENTRALISED BLOOD INVENTORY
              </p>
            </div>
          </div>

          {/* Hamburger menu button — wire up your mobile nav / drawer here */}
          <button aria-label="Open menu" className="flex flex-col gap-1.5 p-2">
            <span className="block w-8 h-[5px] bg-accent" />
            <span className="block w-8 h-[5px] bg-accent" />
            <span className="block w-8 h-[5px] bg-accent" />
          </button>
        </div>
      </header>

      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="relative overflow-hidden bg-herobg">
        {/*
          HERO BACKGROUND MAP ART
          Replace public/assets/hero-map-bg.png with a pre-styled
          dark/desaturated version of the map + pins if you have one
          from Figma — that will look more exact than this CSS filter
          approximation applied to the maroon map image you supplied.
        */}
        <Image
          src="/assets/hero-map-bg.png"
          alt=""
          aria-hidden="true"
          fill
          className="object-cover object-center opacity-40"
          style={{ filter: "grayscale(1) brightness(0.55) contrast(1.1)" }}
        />
        {/* Dark tint over the map so text stays readable */}
        <div className="absolute inset-0 bg-herobg/70" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 sm:py-28">
          {/* Centered on every breakpoint: text-center + mx-auto */}
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading font-extrabold text-5xl sm:text-6xl md:text-7xl leading-[1.05]">
              <span className="text-primary">Pakistan&rsquo;s Blood,</span>
              <br />
              <span className="text-background">Found Fast</span>
              {/* small square blood-drop badge next to headline */}
              <span className="inline-flex align-middle ml-2 items-center justify-center bg-primary w-8 h-8 sm:w-10 sm:h-10">
                <DropIcon fill="#FFFCF7" size={16} />
              </span>
            </h2>

            {/* Decorative curved swoosh under the headline */}
            <SwooshArrow className="w-40 sm:w-52 h-10 mt-4 mb-6 text-secondary mx-auto" />

            <p className="font-body text-lg sm:text-2xl leading-relaxed text-background max-w-xl mx-auto">
              <span className="text-primary font-medium">SURKH</span> achieves
              a <span className="text-primary font-medium">centralised</span>{" "}
              blood distribution system by connecting hospitals, patients and
              donors in{" "}
              <span className="text-primary font-medium">real-time.</span>
            </p>

            {/* CTA buttons — sharp corners, stacked, centered as a column */}
            <div className="mt-10 flex flex-col gap-4 max-w-md mx-auto">
              <a
                href="#find-blood"
                className="bg-primary text-background font-heading font-bold text-xl sm:text-2xl px-6 py-4 flex items-center justify-between hover:bg-primary/90 transition"
              >
                Find Blood
                {/* placeholder icon — swap for your exact icon asset if needed */}
                <span className="inline-flex items-center justify-center w-8 h-8 bg-background">
                  <PlusDropIcon />
                </span>
              </a>

              <a
                href="#get-connected"
                className="bg-secondary text-textcol font-heading font-bold text-xl sm:text-2xl px-6 py-4 flex items-center justify-between hover:bg-secondary/90 transition"
              >
                Get Connected
                <ArrowRightIcon size={22} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          "WHY SURKH?" SECTION
          ============================================================ */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28 px-6">
        {/*
          Decorative corner shape (gold circle behind a dark circle,
          bleeding off the top-right edge). Pure CSS, no image needed.
          Uses inline border-radius:50% because rounded-full is disabled
          globally (buttons/cards must stay sharp-cornered). Sized down
          on mobile so it doesn't overlap the heading text.
        */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 sm:w-72 sm:h-72 sm:-top-16 sm:-right-16 bg-secondary z-0"
          style={{ borderRadius: "50%" }}
          aria-hidden="true"
        />
        <div
          className="absolute -top-6 -right-24 w-40 h-40 sm:w-72 sm:h-72 sm:-top-8 sm:-right-32 bg-accent z-0"
          style={{ borderRadius: "50%" }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <DropIcon fill="#D8323A" size={40} />
          <h2 className="font-heading font-extrabold text-4xl sm:text-5xl text-accent mt-6">
            Why SURKH?
          </h2>

          <p className="font-body text-lg sm:text-xl leading-relaxed mt-8">
            In Pakistan, roughly{" "}
            <span className="text-primary font-bold">5000</span> blood bags
            are collected everyday against a deficit of{" "}
            <span className="text-primary font-bold">8000</span>.
          </p>
          <p className="font-body text-lg sm:text-xl leading-relaxed mt-6">
            Out of these,{" "}
            <span className="text-primary font-bold">4 - 13.5%</span> blood
            is lost due to product expiration and{" "}
            <a href="#" className="text-primary font-bold underline">
              fragmented tracking systems.
            </a>
          </p>
        </div>
      </section>

      {/* ============================================================
          "SURKH RESOLVES THIS BY" — IMPACT CARDS SECTION
          ============================================================ */}
      <section className="bg-background pb-20 sm:pb-28 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-accent text-center mb-12">
            SURKH Resolves This By
          </h2>

          {/* Stacks on mobile, 3 columns on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ImpactCard
              borderColor="border-accent"
              title={
                <>
                  Connecting <span className="text-primary">hospitals</span>{" "}
                  in the donor-patient loop
                </>
              }
              description="Develop trust channels through certified facilities"
            />
            <ImpactCard
              borderColor="border-secondary"
              title={
                <>
                  Allowing facilities to{" "}
                  <span className="text-primary">sync</span> blood
                  inventories
                </>
              }
              description="Real-time updates about available blood nearby"
            />
            <ImpactCard
              borderColor="border-primary"
              title={
                <>
                  Including smaller blood camps via{" "}
                  <span className="text-primary">AI technology</span>
                </>
              }
              description="AI Ledger Reader enables local setups to get connected"
            />
          </div>

          <div className="text-center mt-10">
            <a
              href="#"
              className="font-heading font-bold text-primary text-lg hover:underline"
            >
              Learn More &gt;&gt;
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================
          PHOTO / IMPACT SECTION
          ============================================================ */}
      <section className="w-full relative h-72 sm:h-96 md:h-[480px]">
        {/*
          PLACEHOLDER PHOTO
          Replace public/assets/donation-photo-placeholder.svg with a
          real photo from a blood donation camp / your field visits.
          Keep it wide (at least 1600px) since it stretches full-bleed
          edge to edge.
        */}
        <Image
          src="/assets/donation-photo-placeholder.svg"
          alt="Replace with a real photo from a blood donation camp"
          fill
          className="object-cover"
        />
      </section>
    </>
  );
}

/* ==================================================================
   Reusable "impact" card used in the SURKH Resolves This By section.
   ================================================================== */
function ImpactCard({ borderColor, title, description }) {
  return (
    <div
      className={`relative bg-background shadow-md pl-6 py-8 pr-6 border-l-[6px] ${borderColor}`}
    >
      {/*
        ICON PLACEHOLDER — replace with your own SVG, e.g.:
        <Image src="/assets/icons/hospitals.svg" alt="" width={40} height={40} className="mx-auto mb-4" />
      */}
      <div className="w-10 h-10 mx-auto mb-4 border-2 border-dashed border-accent/30 flex items-center justify-center text-[10px] text-accent/50 font-body">
        ICON
      </div>
      <h3 className="font-heading font-bold text-lg sm:text-xl text-center leading-snug">
        {title}
      </h3>
      <p className="font-body text-sm sm:text-base text-center mt-3 text-textcol/80">
        {description}
      </p>
    </div>
  );
}

/* ==================================================================
   Small inline icon components.
   These are simple placeholder SVGs so the page has no external
   icon-library dependency. Swap any of them for your own icon
   asset (e.g. an exported SVG from Figma) if you want an exact match.
   ================================================================== */

function ArrowRightIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function DropIcon({ fill = "#FFFCF7", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M12 2C12 2 5 12 5 16.2C5 20 8.13 23 12 23C15.87 23 19 20 19 16.2C19 12 12 2 12 2Z" />
    </svg>
  );
}

function PlusDropIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M12 2C12 2 5 12 5 16.2C5 20 8.13 23 12 23C15.87 23 19 20 19 16.2C19 12 12 2 12 2Z"
        fill="#FFFCF7"
        stroke="#D8323A"
        strokeWidth="1.2"
      />
      <path
        d="M12 13v6M9 16h6"
        stroke="#D8323A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SwooshArrow({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 50" fill="none">
      <path
        d="M5 35 C 60 5, 140 5, 175 25"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M175 25 L 165 15 M175 25 L 168 34"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
