import pako from "pako";
import { compressed } from "@/static/compressed";
import { getVisaRequirementType } from "@/static/constants";

interface VisaRequirementByType {
  [key: string]: Array<{
    id: string;
    name: string;
  }>;
}

export async function getVisaRequirementsForCountry(
  citizenshipId: string
): Promise<VisaRequirementByType> {
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
    const shortCode = parts.slice(2).join(",");

    // Handle run-length encoding
    if (!citizenshipId && lastCitizenshipId) {
      citizenshipId = lastCitizenshipId;
    } else if (citizenshipId) {
      lastCitizenshipId = citizenshipId;
    }

    if (!citizenshipId || !destinationId || !shortCode) return;

    // Expand short code using dictionary
    const requirement =
      compressed.dictionary[shortCode as keyof typeof compressed.dictionary] ||
      shortCode;

    // Remove quotes if present
    const cleanRequirement = requirement.replace(/^"(.*)"$/, "$1");

    map.set(`${citizenshipId}-${destinationId}`, cleanRequirement);
  });

  // Import countries from shared package
  const { countries } = await import("@visas/shared");

  // Filter requirements for the given citizenship
  const requirementsByType: VisaRequirementByType = {};

  countries.forEach((destination) => {
    // Skip if it's the same country
    if (destination.id === citizenshipId) return;

    const key = `${citizenshipId}-${destination.id}`;
    const requirement = map.get(key);

    if (!requirement) return;

    const requirementType = getVisaRequirementType(requirement);

    if (!requirementType) {
      // Handle unknown types
      if (!requirementsByType["OTHER"]) {
        requirementsByType["OTHER"] = [];
      }
      requirementsByType["OTHER"].push({
        id: destination.id,
        name: destination.name,
      });
      return;
    }

    if (!requirementsByType[requirementType]) {
      requirementsByType[requirementType] = [];
    }

    requirementsByType[requirementType].push({
      id: destination.id,
      name: destination.name,
    });
  });

  return requirementsByType;
}

