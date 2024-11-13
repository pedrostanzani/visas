import pako from "pako";
import data from "@/static/compressed.json";
import { useMemo } from "react";

export const visaRequirementsEnum: string[] = data.visa_enum;

const useVisaRequirements = () => {
  const visaRequirementsMap = useMemo(() => {
    const binaryData = Uint8Array.from(atob(data.compressed), (c) =>
      c.charCodeAt(0)
    );
    const decompressedData = pako.inflate(binaryData, { to: "string" });

    const map = new Map<string, number>();
    const rows = decompressedData.trim().split("\n");
    rows.slice(1).forEach((row) => {
      const [citizenship, destination, visaRequirement] = row.split(",");
      map.set(`${citizenship}-${destination}`, Number(visaRequirement));
    });

    return map;
  }, []);

  const getVisaRequirement = (citizenship: string, destination: string) => {
    const key = `${citizenship}-${destination}`;
    return visaRequirementsMap.get(key) ?? null;
  };

  return {
    getVisaRequirement,
  };
};

export { useVisaRequirements };