export type VisaRequirementType =
  | "VISA_REQUIRED"
  | "VISA_NOT_REQUIRED"
  | "FREEDOM_OF_MOVEMENT"
  | "EVISA"
  | "VISA_ON_ARRIVAL"
  | null;

export function getVisaRequirementType(
  visaRequirement: string
): VisaRequirementType {
  const normalized = visaRequirement.toLowerCase();
  
  if (normalized === "visa required" || normalized === "online visa required") {
    return "VISA_REQUIRED";
  }

  if (normalized === "evisa" || normalized.startsWith("evisa")) {
    return "EVISA";
  }

  if (normalized === "visa on arrival" || normalized.includes("visa on arrival")) {
    return "VISA_ON_ARRIVAL";
  }

  if (normalized === "visa not required") {
    return "VISA_NOT_REQUIRED";
  }

  if (normalized === "freedom of movement") {
    return "FREEDOM_OF_MOVEMENT";
  }

  return null;
}
