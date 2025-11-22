"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  getVisaRequirementType,
  VisaRequirementType,
} from "@/static/constants";
import { countries } from "@visas/shared";
import { CircleFlag } from "react-circle-flags";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVisaRequirements } from "@/static/countries";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeftRight,
  Globe,
  Shuffle,
  SquareArrowOutUpRight,
} from "lucide-react";

const formatVisaRequirement = (visaRequirement: string) => {
  if (visaRequirement === "evisa") {
    return "e-Visa";
  }
  return visaRequirement;
};

const generateDetails = (
  citizenshipCountry: string,
  destinationCountry: string,
  visaRequirement: string,
  visaRequirementType: VisaRequirementType
) => {
  if (visaRequirementType === "FREEDOM_OF_MOVEMENT") {
    return `Citizens from ${citizenshipCountry} can freely visit ${destinationCountry}.`;
  }

  if (visaRequirementType === "VISA_NOT_REQUIRED") {
    return `Citizens from ${citizenshipCountry} do not require a visa to visit ${destinationCountry}.`;
  }

  if (visaRequirementType === "VISA_REQUIRED") {
    return `Citizens from ${citizenshipCountry} require a visa to visit ${destinationCountry}.`;
  }

  if (visaRequirementType === "VISA_ON_ARRIVAL") {
    return `Citizens from ${citizenshipCountry} require a visa on arrival to visit ${destinationCountry}.`;
  }

  if (visaRequirementType === "EVISA") {
    return `Citizens from ${citizenshipCountry} require an e-Visa to visit ${destinationCountry}.`;
  }

  return `The visa requirement status for citizens of ${citizenshipCountry} to visit ${destinationCountry} is: ${visaRequirement}.`;
};

const generateColor = (visaRequirementType: VisaRequirementType) => {
  if (visaRequirementType === "FREEDOM_OF_MOVEMENT") return `bg-green-600`;
  if (visaRequirementType === "VISA_NOT_REQUIRED") return `bg-green-600`;
  if (visaRequirementType === "VISA_REQUIRED") return `bg-red-600`;
  if (visaRequirementType === "EVISA") return `bg-amber-400`;
  if (visaRequirementType === "VISA_ON_ARRIVAL") return `bg-amber-400`;
  return `bg-neutral-600`;
};

const VisaScreener = () => {
  const [citizenship, setCitizenship] = useState<string | undefined>("us");
  const [destination, setDestination] = useState<string | undefined>("ar");

  const citizenshipCountryName = countries.find(
    (c) => c.id === citizenship
  )?.name;
  const destinationCountryName = countries.find(
    (c) => c.id === destination
  )?.name;

  const citizenshipCountry = citizenship
    ? countries.find((c) => c.id === citizenship)
    : null;

  const { getVisaRequirement } = useVisaRequirements();
  const visaRequirement =
    citizenship && destination
      ? getVisaRequirement(citizenship, destination)
      : null;

  const visaRequirementType = visaRequirement
    ? getVisaRequirementType(visaRequirement)
    : null;

  // Count visa-free countries (VISA_NOT_REQUIRED and FREEDOM_OF_MOVEMENT) for citizenship country
  const visaFreeCount = useMemo(() => {
    if (!citizenship) return 0;
    let count = 0;
    countries.forEach((country) => {
      if (country.id === citizenship) return;
      const requirement = getVisaRequirement(citizenship, country.id);
      if (requirement) {
        const type = getVisaRequirementType(requirement);
        if (type === "VISA_NOT_REQUIRED" || type === "FREEDOM_OF_MOVEMENT") {
          count++;
        }
      }
    });
    return count;
  }, [citizenship, getVisaRequirement]);

  // Round down to nearest multiple of 10
  const roundedVisaFreeCount = useMemo(() => {
    return Math.floor(visaFreeCount / 10) * 10;
  }, [visaFreeCount]);

  const handleSwap = () => {
    const prevCitizenship = citizenship;
    setCitizenship(destination);
    setDestination(prevCitizenship);
  };

  const handleShuffle = () => {
    const shuffled = [...countries].sort(() => Math.random() - 0.5);
    setCitizenship(shuffled[0].id);
    setDestination(shuffled[1].id);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
        <div className="w-full">
          <p className="text-sm text-neutral-600 pb-2 tracking-tighter font-bold uppercase">
            Country of citizenship
          </p>
          <Select value={citizenship} onValueChange={setCitizenship}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Coudntry of Citizenship</SelectLabel>
                {[...countries]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      <div className="flex gap-1.5 items-center">
                        <CircleFlag
                          countryCode={country.id}
                          className="h-6 w-6"
                        />
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full">
          <p className="text-sm text-neutral-600 pb-2 tracking-tighter font-bold uppercase">
            Country of destination
          </p>
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Country of Destination</SelectLabel>
                {[...countries]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      <div className="flex gap-1.5 items-center">
                        <CircleFlag
                          countryCode={country.id}
                          className="h-6 w-6"
                        />
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="hidden sm:flex flex-row self-end flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleSwap} variant="outline">
                <ArrowLeftRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Swap</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleShuffle} variant="outline">
                <Shuffle />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Shuffle</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      {visaRequirement && (
        <div className="mt-6 space-y-4">
          <Card className="flex gap-3 overflow-hidden">
            <div className={cn("w-3", generateColor(visaRequirementType))} />
            <div className="py-4 pr-4">
              <h2 className="text-xl font-black pb-0.5 tracking-tighter uppercase">
                {formatVisaRequirement(visaRequirement)}
              </h2>
              <p className="text-neutral-500">
                {generateDetails(
                  citizenshipCountryName!,
                  destinationCountryName!,
                  visaRequirement,
                  visaRequirementType
                )}
              </p>
            </div>
          </Card>
          {citizenshipCountry && (
            <Card className="p-4 flex flex-col gap-2 overflow-hidden">
              <div className="uppercase flex items-center gap-2 tracking-tighter font-semibold text-base">
                <CircleFlag
                  countryCode={citizenshipCountry.id}
                  className="h-5 w-5 flex-shrink-0 self-start mt-[2px]"
                />
                <h3>VISA REQUIREMENTS FOR {citizenshipCountryName} CITIZENS</h3>
              </div>
              <div className="flex items-center mt-0.5 mb-2">
                <p className="text-neutral-500">
                  Citizens from {citizenshipCountryName} have visa-free access
                  to
                  {roundedVisaFreeCount >= 10 ? (
                    <> over {roundedVisaFreeCount} countries.</>
                  ) : visaFreeCount > 0 ? (
                    <> multiple countries.</>
                  ) : (
                    <> countries.</>
                  )}{" "}
                  <br className="hidden md:block" />
                  Check out the full list of countries below.
                </p>
              </div>
              <Button className="self-start" variant="outline" asChild>
                <Link href={`/${citizenshipCountry.slug}`}>
                  <Globe />
                  View all
                </Link>
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default VisaScreener;
