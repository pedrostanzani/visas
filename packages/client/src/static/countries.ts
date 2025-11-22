import pako from "pako";
import { compressed } from "./compressed";
import { useMemo } from "react";

const useVisaRequirements = () => {
  const visaRequirementsMap = useMemo(() => {
    // Decode base64 to binary
    const binaryData = Uint8Array.from(atob(compressed.data), (c) =>
      c.charCodeAt(0)
    );
    
    // Decompress with gzip
    const decompressedData = pako.inflate(binaryData, { to: "string" });

    const map = new Map<string, string>();
    const rows = decompressedData.trim().split("\n");
    
    // Skip header row and process data rows
    let lastCitizenshipId = "";
    
    rows.slice(1).forEach((row) => {
      if (!row) return;
      
      const parts = row.split(",");
      if (parts.length < 3) return;
      
      let citizenshipId = parts[0];
      const destinationId = parts[1];
      const shortCode = parts.slice(2).join(","); // Handle commas in requirement
      
      // Handle run-length encoding: reconstruct citizenship_id if empty
      if (!citizenshipId && lastCitizenshipId) {
        citizenshipId = lastCitizenshipId;
      } else if (citizenshipId) {
        lastCitizenshipId = citizenshipId;
      }
      
      if (!citizenshipId || !destinationId || !shortCode) return;
      
      // Expand short code using dictionary
      const requirement = compressed.dictionary[shortCode as keyof typeof compressed.dictionary] || shortCode;
      
      // Remove quotes if present
      const cleanRequirement = requirement.replace(/^"(.*)"$/, '$1');
      
      map.set(`${citizenshipId}-${destinationId}`, cleanRequirement);
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