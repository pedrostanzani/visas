"use client";

import { useState } from "react";
import {
  countries,
  getVisaRequirementType,
  VisaRequirementType,
} from "@/static/constants";
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
import { ArrowLeftRight, Shuffle } from "lucide-react";

const formatVisaRequirement = (visaRequirement: string) => {
  if (visaRequirement === "evisa") {
    return "e-Visa";
  }
  return visaRequirement;
}

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
  const [citizenship, setCitizenship] = useState<string | undefined>("br");
  const [destination, setDestination] = useState<string | undefined>(undefined);

  const citizenshipCountryName = countries.find(
    (c) => c.id === citizenship
  )?.name;
  const destinationCountryName = countries.find(
    (c) => c.id === destination
  )?.name;

  const { getVisaRequirement } = useVisaRequirements();
  const visaRequirement =
    citizenship && destination
      ? getVisaRequirement(citizenship, destination)
      : null;
      
  const visaRequirementType = visaRequirement
    ? getVisaRequirementType(visaRequirement)
    : null;

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
                {countries.map((country) => (
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
                {countries.map((country) => (
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
        <div className="mt-6">
          <Card className="flex gap-3 overflow-hidden">
            <div className={cn("w-3", generateColor(visaRequirementType))} />
            <div className="py-4 pr-4">
              <h2 className="text-lg font-black pb-0.5 tracking-tighter uppercase">
                {formatVisaRequirement(visaRequirement)}
              </h2>
              <p className="text-neutral-500 text-sm">
                {generateDetails(
                  citizenshipCountryName!,
                  destinationCountryName!,
                  visaRequirement,
                  visaRequirementType
                )}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VisaScreener;
