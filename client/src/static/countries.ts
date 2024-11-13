import pako from "pako";
import data from "@/static/compressed.json";

export const visaRequirementsEnum: string[] = data.visa_enum;

const useVisaRequirements = () => {
  const binaryData = Uint8Array.from(atob(data.compressed), (c) =>
    c.charCodeAt(0)
  );
  const decompressedData = pako.inflate(binaryData, { to: "string" });

  const rows = decompressedData.trim().split("\n");
  const visaRequirementsMap = new Map<string, number>();
  rows.slice(1).forEach((row) => {
    const [citizenship, destination, visaRequirement] = row.split(",");
    visaRequirementsMap.set(`${citizenship}-${destination}`, Number(visaRequirement));
  });

  const getVisaRequirement = (citizenship: string, destination: string) => {
    const key = `${citizenship}-${destination}`;
    return visaRequirementsMap.get(key) ?? null;
  };

  return {
    getVisaRequirement,
  };
};

export { useVisaRequirements };