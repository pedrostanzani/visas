import { gzipSync } from "node:zlib";

const REQUIREMENT_MAP: Record<string, string> = {
  "Visa required": "VR",
  "Visa not required": "VNR",
  "eVisa": "EV",
  "Visa on arrival": "VOA",
  "eVisa / Visa on arrival": "EV/VOA",
  "Visa on arrival / eVisa": "VOA/EV",
  "Freedom of movement": "FOM",
  "Online Visa": "OV",
  "Visa-free": "VF",
  "Electronic Travel Authorization": "ETAz",  // 'z' for authoriZation
  "eTA": "eTa",  // Lowercase 'a' to distinguish from ETA
  "Electronic Travel Authority": "ETAy",  // 'y' for authoritY
  "ETA": "ETA",  // Uppercase ETA as-is
};

function createReverseMap(): Record<string, string> {
  const reverseMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(REQUIREMENT_MAP)) {
    reverseMap[value] = key;
  }
  return reverseMap;
}

function applyDictionaryCompression(csvContent: string): string {
  const rows = csvContent.split('\n');
  const compressedRows = [rows[0]]; // Keep header
  
  let lastCitizenshipId = '';
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    
    const parts = row.split(',');
    if (parts.length >= 3) {
      const citizenshipId = parts[0];
      const destinationId = parts[1];
      let requirement = parts.slice(2).join(','); // Handle commas in requirement field
      
      if (citizenshipId && destinationId && requirement) {
        // Remove quotes if present
        requirement = requirement.replace(/^"(.*)"$/, '$1');
        
        // Replace with short code if exists
        const shortCode = REQUIREMENT_MAP[requirement] || requirement;
        
        // Run-length encoding: omit citizenship_id if it's the same as previous row
        const outputCitizenshipId = citizenshipId === lastCitizenshipId ? '' : citizenshipId;
        lastCitizenshipId = citizenshipId;
        
        compressedRows.push(`${outputCitizenshipId},${destinationId},${shortCode}`);
      }
    } else {
      compressedRows.push(row);
    }
  }
  
  return compressedRows.join('\n');
}

async function main() {
  const csvPath = `${import.meta.dir}/../data/output/visa-data.csv`;
  const csvFile = Bun.file(csvPath);
  
  if (!(await csvFile.exists())) {
    console.error(`❌ Error: CSV file not found at ${csvPath}`);
    console.error('Please run the parser first to generate visa-data.csv');
    process.exit(1);
  }
  
  const csvContent = await csvFile.text();
  const csvRows = csvContent.split('\n');
  
  console.log('🗜️  Compressing visa data with gzip + Dictionary + RLE...\n');
  
  // Apply dictionary compression
  const compressedCsvContent = applyDictionaryCompression(csvContent);
  
  // Create reverse map for decompression
  const reverseMap = createReverseMap();
  
  // Gzip compression (dictionary-compressed CSV)
  const gzipDictContent = gzipSync(compressedCsvContent);
  
  // Create JSON output with gzip + Dictionary + base64
  const compressedData = {
    data: Buffer.from(gzipDictContent).toString('base64'),
    encoding: "base64",
    compression: "gzip",
    format: "csv",
    dictionary: reverseMap,
    metadata: {
      totalEntries: csvRows.length - 1,
      generatedAt: new Date().toISOString(),
      columns: ["citizenship_id", "destination_id", "requirement"]
    }
  };
  
  const outputPath = `${import.meta.dir}/../data/output/compressed.json`;
  await Bun.write(outputPath, JSON.stringify(compressedData));
  
  // Display size comparison
  const csvSize = new Blob([csvContent]).size;
  const compressedCsvSize = new Blob([compressedCsvContent]).size;
  const gzipDictSize = gzipDictContent.length;
  const jsonSize = new Blob([JSON.stringify(compressedData)]).size;
  
  console.log('📏 Size comparison:');
  console.log(`   Original CSV:       ${(csvSize / 1024).toFixed(2)} KB (100%)`);
  console.log(`   Dict + RLE CSV:     ${(compressedCsvSize / 1024).toFixed(2)} KB (${((compressedCsvSize / csvSize) * 100).toFixed(1)}%)`);
  console.log(`   Gzip (raw):         ${(gzipDictSize / 1024).toFixed(2)} KB (${((gzipDictSize / csvSize) * 100).toFixed(1)}%)`);
  console.log(`   JSON (base64):      ${(jsonSize / 1024).toFixed(2)} KB (${((jsonSize / csvSize) * 100).toFixed(1)}%)`);
  
  const compressionRatio = ((1 - (jsonSize / csvSize)) * 100).toFixed(1);
  const sizeSavings = ((csvSize - jsonSize) / 1024).toFixed(2);
  
  console.log('\n✅ Compression complete!');
  console.log(`📦 Generated: compressed.json (${(jsonSize / 1024).toFixed(2)} KB)`);
  console.log(`💾 Size savings: ${sizeSavings} KB (${compressionRatio}% reduction)`);
}

await main();

