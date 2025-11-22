import { countries } from "@visas/shared";
import { notFound } from "next/navigation";
import { CircleFlag } from "react-circle-flags";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getVisaRequirementsForCountry } from "./get-visa-requirements";

const formatCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    VISA_NOT_REQUIRED: "Visa Free",
    FREEDOM_OF_MOVEMENT: "Freedom of Movement",
    VISA_REQUIRED: "Visa Required",
    EVISA: "e-Visa",
    VISA_ON_ARRIVAL: "Visa on Arrival",
    OTHER: "Other",
  };
  return categoryMap[category] || category;
};

const generateCategoryColor = (category: string): string => {
  if (category === "FREEDOM_OF_MOVEMENT") return "bg-green-500/30";
  if (category === "VISA_NOT_REQUIRED") return "bg-green-500/30";
  if (category === "VISA_REQUIRED") return "bg-red-500/30";
  if (category === "EVISA") return "bg-amber-500/30";
  if (category === "VISA_ON_ARRIVAL") return "bg-amber-500/30";
  return "bg-neutral-500/30";
};

export default async function CountryPage({
  params,
}: {
  params: {
    slug: string;
  };
}) {
  const { slug } = await params;
  const country = countries.find((c) => c.slug === slug);

  if (!country) {
    notFound();
  }

  const requirementsByType = await getVisaRequirementsForCountry(country.id);

  // Sort categories in a logical order
  const categoryOrder = [
    "FREEDOM_OF_MOVEMENT",
    "VISA_NOT_REQUIRED",
    "VISA_ON_ARRIVAL",
    "EVISA",
    "VISA_REQUIRED",
    "OTHER",
  ];

  const sortedCategories = categoryOrder.filter(
    (cat) => requirementsByType[cat] && requirementsByType[cat].length > 0
  );

  return (
    <div className="flex-1 max-w-3xl pt-4 pb-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CircleFlag countryCode={country.id} className="h-8 w-8 flex-shrink-0" />
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            {country.name}
          </h1>
        </div>
        <p className="text-neutral-500 max-w-2xl">
          Visa requirements for citizens of {country.name}. Make sure to consult
          official government websites for the most accurate and up-to-date
          information.
        </p>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="text-neutral-500">No visa requirement data available.</p>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((category) => {
            const destinations = requirementsByType[category] || [];
            // Sort destinations alphabetically by name
            const sortedDestinations = [...destinations].sort((a, b) =>
              a.name.localeCompare(b.name)
            );

            return (
              <Card key={category} className="flex gap-3 overflow-hidden">
                <div className={cn("w-3", generateCategoryColor(category))} />
                <div className="py-4 pr-4 flex-1">
                  <h2 className="text-xl font-bold mb-4 uppercase tracking-tighter">
                    {formatCategoryName(category)} ({destinations.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {sortedDestinations.map((destination) => (
                      <div
                        key={destination.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CircleFlag
                          countryCode={destination.id}
                          className="h-5 w-5 flex-shrink-0"
                        />
                        <span className="truncate text-zinc-200">{destination.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
