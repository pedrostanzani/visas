import { LINKS } from "@/wikipedia/constants/links";
import { countriesById } from "@visas/shared";
import { fetchHTML } from "@/lib";

const DATA_DIR = `${import.meta.dir}/../data`;
const DELAY_MS = 1000; // 1 second delay between requests to be respectful to Wikipedia

// Fetch HTML for a single country
async function fetchCountryHtml(id: string, url: string): Promise<boolean> {
  try {
    const country = countriesById[id];
    const countryDisplay = country ? `${country.emoji} ${country.name}` : id;
    console.log(`Fetching ${countryDisplay}...`);
    const html = await fetchHTML(url);
    const filePath = `${DATA_DIR}/${id}.html`;
    
    await Bun.write(filePath, html);
    console.log(`✓ Saved ${id}.html (${(html.length / 1024).toFixed(2)} KB)`);
    
    return true;
  } catch (error) {
    console.error(`✗ Error fetching ${id}:`, error);
    return false;
  }
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main function
async function main() {
  console.log(`Starting to fetch ${LINKS.length} country pages...\n`);
  console.log(`Data directory: ${DATA_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < LINKS.length; i++) {
    const country = LINKS[i];
    if (!country) continue;
    
    const { id, link } = country;
    const success = await fetchCountryHtml(id, link);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Add delay between requests (except for the last one)
    if (i < LINKS.length - 1) {
      await delay(DELAY_MS);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Completed: ${successCount} succeeded, ${failCount} failed`);
  console.log("=".repeat(50));
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

