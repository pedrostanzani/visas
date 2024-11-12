import { TicketsPlane } from "lucide-react";
import VisaScreener from "@/components/visa-screener";

export default function Home() {
  return (
    <div className="px-4 max-w-3xl mx-auto">
      <header className="flex py-6 justify-between items-center text-white">
        <h1 className="text-3xl font-black tracking-tighter">
          DO I NEED A VISA?
        </h1>
        <TicketsPlane />
      </header>
      <main>
        <VisaScreener />
      </main>
    </div>
  );
}
