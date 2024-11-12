"use client";

import React, { useEffect, useState } from "react";
import { countries } from "@/static/countries";
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
import visaData from "@/static/visa-requirements.json";

const VisaScreener = () => {
  const [citizenship, setCitizenship] = useState<string | undefined>("undefined");
  const [destination, setDestination] = useState<string | undefined>(undefined);

  const targetVisaRecord = visaData.filter(record => record.country_of_citizenship === citizenship && record.country_of_destination === destination)[0];

  useEffect(() => {
    setCitizenship("br");
  }, [])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
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
                <SelectLabel>Country of Citizenship</SelectLabel>
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
      </div>
      { targetVisaRecord !== undefined && <div className="mt-6">{targetVisaRecord.visa_requirement}</div>}
    </div>
  );
};

export default VisaScreener;
