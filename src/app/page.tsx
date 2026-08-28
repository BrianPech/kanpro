import { Navbar } from "@/components/marketing/navbar";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#faf8f2]">
      {/* Layer 1 */}
      <div
        className="pointer-events-none absolute inset-0 blur-[90px] md:blur-[130px]"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0) 0%, rgba(200,230,255,0.12) 28%, rgb(255,255,255) 18%, rgb(150,200,255) 68%, rgb(100,130,200) 100%)",
          mixBlendMode: "multiply",
        }}
        aria-hidden="true"
      />
      {/* Layer 2 */}
      <div
        className="pointer-events-none absolute inset-0 blur-[90px] md:blur-[130px]"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0) 0%, rgba(200,230,255,0.22) 34%, rgb(255,255,255) 66%, rgb(150,200,255) 82%, rgb(100,130,200) 100%)",
          mixBlendMode: "multiply",
        }}
        aria-hidden="true"
      />
      {/* Content wrapper - keep it above the absolute layers */}
      <div className="relative z-[1] flex min-h-screen w-full flex-col">
        <Navbar />
        {/* Contenido principal */}
      </div>
    </div>
  );
}

