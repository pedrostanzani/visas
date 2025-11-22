import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { countries, type Country } from "@visas/shared";
import { isTruthy, resolveCountryId } from "@/lib";

import {
  hasVisaOrEntryRequirement,
  isInVisaRequirementsSection,
  isTerritoryTable,
  isVisitorToTable,
} from "./filters";
import {
  findColumnIndex,
  findSectionName,
  removeCitationMarkers,
} from "./utils";

interface TableData {
  $table: cheerio.Cheerio<Element>;
  headers: string[];
}

interface TableDataWithSection extends TableData {
  getSection: () => { section: string; subsection: string };
}

interface TableFilter {
  name: string;
  filter: (table: TableDataWithSection) => boolean;
}

interface ParsedRow {
  destinationId: string | null;
  destinationName: string;
  requirement: string;
  allowedStay: string | null;
}

type VisaEntry = {
  requirement: string;
  allowedStay: string | null;
} | null;

type VisaData = Record<string, Record<string, VisaEntry>>;

class NoTableFoundError extends Error {
  constructor(country: Country) {
    super(`No table found for ${country.name}`);
  }
}

class NoTargetColumnError extends Error {
  constructor(country: Country, column: string) {
    super(`No ${column} column found for ${country.name}`);
  }
}

const COLUMN_HEADERS = {
  country: ["Country", "Country / Region", "Territory", "Destination"],
  visaRequirement: ["Visa requirement", "Entry requirement", "Entry"],
  allowedStay: ["Allowed stay", "Stay duration", "Maximum stay", "Duration"],
};

const filters: TableFilter[] = [
  {
    name: "has-visa-or-entry-requirement",
    filter: (table) => hasVisaOrEntryRequirement(table.headers),
  },
  {
    name: "exclude-visitor-to-tables",
    filter: (table) => !isVisitorToTable(table.headers),
  },
  {
    name: "exclude-territory-tables",
    filter: (table) => !isTerritoryTable(table.headers),
  },
  {
    name: "visa-requirements-section-only",
    filter: (table) => {
      const section = table.getSection();
      return isInVisaRequirementsSection(section.section);
    },
  },
  {
    name: "prefer-no-subsections",
    filter: (table) => {
      const section = table.getSection();
      return section.subsection === "";
    },
  },
];

function extractRequirementsTable(
  $: cheerio.CheerioAPI,
  country: Country
): TableData {
  const sortableTables = $("table.sortable");

  if (sortableTables.length === 0) {
    throw new NoTableFoundError(country);
  }

  if (sortableTables.length === 1) {
    const headers = sortableTables
      .first()
      .find("tr:first th, thead tr:first th")
      .map((i, th) => {
        return $(th).text().trim();
      })
      .get();
    return { $table: sortableTables.first(), headers };
  }

  // Create a cache for section names (per country)
  const sectionCache = new WeakMap<
    Element,
    { section: string; subsection: string }
  >();

  const sortableTablesWithData: TableDataWithSection[] = sortableTables
    .map((_, element) => {
      const $table = $(element);
      const headers = $table
        .find("tr:first th, thead tr:first th")
        .map((i, th) => {
          return $(th).text().trim();
        })
        .get();

      // Create a lazy getter that caches the result
      const getSection = () => {
        const el = $table.get(0)!;
        if (!sectionCache.has(el)) {
          sectionCache.set(el, findSectionName($table));
        }
        return sectionCache.get(el)!;
      };

      return { $table, headers, getSection };
    })
    .get();

  let filteredTables = sortableTablesWithData;

  for (const f of filters) {
    if (filteredTables.length === 1) {
      break;
    }

    const result = filteredTables.filter((table) => f.filter(table));

    // Safety check: only apply if it doesn't result in zero tables
    if (result.length > 0) {
      filteredTables = result;
    }
  }

  const table = filteredTables[0];
  if (isTruthy(table)) {
    return {
      $table: table.$table,
      headers: table.headers,
    };
  }

  throw new NoTableFoundError(country);
}

function parseArticle($: cheerio.CheerioAPI, country: Country) {
  const table = extractRequirementsTable($, country);

  const countryColIndex = findColumnIndex(
    table.headers,
    COLUMN_HEADERS.country
  );
  const visaReqColIndex = findColumnIndex(
    table.headers,
    COLUMN_HEADERS.visaRequirement
  );
  const allowedStayColIndex = findColumnIndex(
    table.headers,
    COLUMN_HEADERS.allowedStay
  );

  if (countryColIndex === null || visaReqColIndex === null) {
    throw new NoTargetColumnError(country, "country or visa requirement");
  }

  const rows: ParsedRow[] = [];

  table.$table.find("tbody tr").each((_, row) => {
    const $row = $(row);
    const cells = $row.find("td");

    if (cells.length === 0) {
      return;
    }

    const countryCell = cells.eq(countryColIndex);
    const visaReqCell = cells.eq(visaReqColIndex);
    const allowedStayCell =
      allowedStayColIndex !== null ? cells.eq(allowedStayColIndex) : null;

    const countryLink = countryCell.find("a").first();
    const destinationName = removeCitationMarkers(
      countryLink.length > 0 ? countryLink.text() : countryCell.text()
    );

    if (!destinationName) {
      return; // Skip empty rows
    }

    const destinationId = resolveCountryId(destinationName);
    const requirement = removeCitationMarkers(visaReqCell.text());
    const allowedStay = allowedStayCell
      ? removeCitationMarkers(allowedStayCell.text())
      : null;

    rows.push({
      destinationId,
      destinationName,
      requirement,
      allowedStay,
    });
  });

  return rows;
}

function checkForMissingEntries(visaData: VisaData) {
  const missingEntries: {
    citizenshipId: string;
    citizenshipName: string;
    destinationId: string;
    destinationName: string;
  }[] = [];

  for (const citizenship of countries) {
    const citizenshipData = visaData[citizenship.id];
    if (!citizenshipData) {
      // This citizenship country has no data at all, so all other countries are missing
      for (const destination of countries) {
        if (destination.id !== citizenship.id) {
          missingEntries.push({
            citizenshipId: citizenship.id,
            citizenshipName: citizenship.name,
            destinationId: destination.id,
            destinationName: destination.name,
          });
        }
      }
      continue;
    }

    for (const destination of countries) {
      if (destination.id === citizenship.id) {
        continue; // Skip same country
      }

      if (!citizenshipData[destination.id]) {
        missingEntries.push({
          citizenshipId: citizenship.id,
          citizenshipName: citizenship.name,
          destinationId: destination.id,
          destinationName: destination.name,
        });
      }
    }
  }

  return missingEntries;
}

async function main({ logs = false }: { logs?: boolean } = {}) {
  const visaData: VisaData = {};

  for (const country of countries) {
    const { id } = country;
    const htmlFile = Bun.file(`${import.meta.dir}/../../data/${id}.html`);
    const html = await htmlFile.text();
    const $ = cheerio.load(html);
    const rows = parseArticle($, country);

    visaData[id] = {};
    for (const row of rows) {
      if (row.destinationId) {
        visaData[id][row.destinationId] = {
          requirement: row.requirement,
          allowedStay: row.allowedStay,
        };
      }
    }

    if (logs) { 
      console.log("✓ Processed", country.name, "[", id, "]");
    }
  }

  const missingEntries = checkForMissingEntries(visaData);
  if (missingEntries.length > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("⚠️  MISSING ENTRIES (UN member state → UN member state)");
    console.log("=".repeat(60));

    // Group by citizenship for easier review
    const groupedByCountry = new Map<string, { id: string; name: string }[]>();
    for (const entry of missingEntries) {
      const key = `${entry.citizenshipName} (${entry.citizenshipId})`;
      const destinations = groupedByCountry.get(key) || [];
      destinations.push({
        id: entry.destinationId,
        name: entry.destinationName,
      });
      groupedByCountry.set(key, destinations);
    }

    for (const [citizenship, destinations] of groupedByCountry) {
      console.log(`\n${citizenship}:`);
      for (const dest of destinations) {
        console.log(`  - ${dest.name} (${dest.id})`);
      }
    }
  } else {
    console.log(
      "\n🎉 No missing entries! All UN member state pairs are present."
    );
  }

  // Convert visaData to CSV format
  const csvRows: string[] = ["citizenship_id,destination_id,requirement"];
  
  for (const [citizenshipId, destinations] of Object.entries(visaData)) {
    for (const [destinationId, entry] of Object.entries(destinations)) {
      if (entry) {
        // Escape commas and quotes in the requirement field
        const requirement = entry.requirement.replace(/"/g, '""');
        
        // Wrap fields in quotes if they contain commas, newlines, or quotes
        const requirementField = requirement.includes(',') || requirement.includes('\n') || requirement.includes('"')
          ? `"${requirement}"`
          : requirement;
        
        csvRows.push(`${citizenshipId},${destinationId},${requirementField}`);
      }
    }
  }
  
  const csvContent = csvRows.join('\n');
  
  // Save visaData to CSV file (directory will be created automatically)
  const outputPath = `${import.meta.dir}/../../data/output/visa-data.csv`;
  await Bun.write(outputPath, csvContent);
  console.log(`\n💾 Saved visa data to ${outputPath}`);
  console.log(`📊 Total entries: ${csvRows.length - 1} (${csvRows.length} rows including header)`);
}

await main({ logs: true });
