export function hasVisaOrEntryRequirement(headers: string[]): boolean {
  const headerText = headers.join(" ").toLowerCase();
  return (
    headerText.includes("visa requirement") ||
    headerText.includes("entry requirement")
  );
}

export function isVisitorToTable(headers: string[]): boolean {
  for (const header of headers) {
    const trimmed = header.trim();
    if (trimmed !== "") {
      return trimmed === "Visitor to";
    }
  }
  return false;
}

export function isTerritoryTable(headers: string[]): boolean {
  for (const header of headers) {
    const trimmed = header.trim();
    if (trimmed !== "") {
      return trimmed === "Territory";
    }
  }
  return false;
}

export function isInVisaRequirementsSection(section: string): boolean {
  // Check if the h2 section is "Visa requirements"
  return section === "Visa requirements";
}
