import * as path from "path";

type VisaEntry = {
  requirement: string;
  allowedStay: string | null;
};

type VisaData = Record<string, Record<string, VisaEntry>>;

function parseCSV(csvContent: string): VisaData {
  const lines = csvContent.split('\n');
  const visaData: VisaData = {};
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < 3) continue;
    
    const citizenshipId = parts[0];
    const destinationId = parts[1];
    let requirement = parts.slice(2).join(','); // Handle commas in requirement
    
    // Skip if any required field is missing
    if (!citizenshipId || !destinationId || !requirement) continue;
    
    // Remove quotes if present
    requirement = requirement.replace(/^"(.*)"$/, '$1');
    
    // Initialize citizenship object if needed
    if (!visaData[citizenshipId]) {
      visaData[citizenshipId] = {};
    }
    
    // Add entry (allowedStay is null since we no longer track it)
    visaData[citizenshipId][destinationId] = {
      requirement,
      allowedStay: null,
    };
  }
  
  return visaData;
}

async function analyzeVisaData() {
  // Load the visa data from CSV
  const dataPath = path.join(import.meta.dir, "../data/output/visa-data.csv");
  const file = Bun.file(dataPath);
  const csvContent = await file.text();
  const visaData: VisaData = parseCSV(csvContent);

  // Count requirements
  const requirementCounts = new Map<string, number>();
  let totalEntries = 0;

  // Iterate through all citizenship -> destination pairs
  for (const citizenship in visaData) {
    for (const destination in visaData[citizenship]) {
      const entry = visaData[citizenship][destination];
      if (!entry) continue;
      
      totalEntries++;

      // Count requirement types
      const requirement = entry.requirement.trim();
      requirementCounts.set(
        requirement,
        (requirementCounts.get(requirement) || 0) + 1
      );
    }
  }

  // Sort by count (descending)
  const sortedRequirements = Array.from(requirementCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  // Print results
  console.log("=" .repeat(70));
  console.log("📊 VISA DATA ANALYSIS");
  console.log("=".repeat(70));
  console.log(`\nTotal visa entries: ${totalEntries.toLocaleString()}`);
  console.log(`Unique requirement types: ${requirementCounts.size}`);

  console.log("\n" + "=".repeat(70));
  console.log("🔍 VISA REQUIREMENTS");
  console.log("=".repeat(70));
  console.log(
    `${"Requirement".padEnd(40)} ${"Count".padStart(10)} ${"Percentage".padStart(12)}`
  );
  console.log("-".repeat(70));

  for (const [requirement, count] of sortedRequirements) {
    const percentage = ((count / totalEntries) * 100).toFixed(2);
    console.log(
      `${requirement.padEnd(40)} ${count.toString().padStart(10)} ${(percentage + "%").padStart(12)}`
    );
  }

  // Additional statistics
  console.log("\n" + "=".repeat(70));
  console.log("📈 SUMMARY STATISTICS");
  console.log("=".repeat(70));

  // Count visa-free entries
  const visaFreeCount = Array.from(requirementCounts.entries())
    .filter(([req]) =>
      req.toLowerCase().includes("visa not required") ||
      req.toLowerCase().includes("visa free") ||
      req === "Freedom of movement"
    )
    .reduce((sum, [, count]) => sum + count, 0);

  const visaRequiredCount =
    requirementCounts.get("Visa required") || 0;
  const eVisaCount = Array.from(requirementCounts.entries())
    .filter(([req]) => req.toLowerCase().includes("evisa"))
    .reduce((sum, [, count]) => sum + count, 0);
  const visaOnArrivalCount = Array.from(requirementCounts.entries())
    .filter(([req]) => req.toLowerCase().includes("on arrival"))
    .reduce((sum, [, count]) => sum + count, 0);

  console.log(
    `Visa-free entries: ${visaFreeCount.toLocaleString()} (${((visaFreeCount / totalEntries) * 100).toFixed(2)}%)`
  );
  console.log(
    `Visa required: ${visaRequiredCount.toLocaleString()} (${((visaRequiredCount / totalEntries) * 100).toFixed(2)}%)`
  );
  console.log(
    `eVisa options: ${eVisaCount.toLocaleString()} (${((eVisaCount / totalEntries) * 100).toFixed(2)}%)`
  );
  console.log(
    `Visa on arrival: ${visaOnArrivalCount.toLocaleString()} (${((visaOnArrivalCount / totalEntries) * 100).toFixed(2)}%)`
  );

  console.log("\n" + "=".repeat(70));
}

await analyzeVisaData();

