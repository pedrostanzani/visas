import { TicketsPlane } from "lucide-react";
import VisaScreener from "@/components/visa-screener";

export default async function Home() {
  return (
    <div className="px-4 max-w-3xl mx-auto flex flex-col h-full">
      <header className="flex py-6 justify-between items-center text-white">
        <h1 className="text-3xl font-black tracking-tighter uppercase">
          Do I need a Visa?
        </h1>
        <div className="fantano">
          <TicketsPlane />
        </div>
      </header>
      <main className="flex-1">
        <VisaScreener />
      </main>
      <footer className="text-xs text-center py-5 text-neutral-600">
        Disclaimer: This is a personal project and not an official source of immigration advice. <br/> Please consult official government websites for the most accurate and up-to-date information.
      </footer>
    </div>
  );
}
