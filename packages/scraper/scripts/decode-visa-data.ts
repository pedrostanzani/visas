import { gunzipSync, brotliDecompressSync } from "node:zlib";

interface CompressedVisaData {
  data: string;
  encoding: "base64";
  compression: "gzip" | "brotli";
  format: "csv" | "binary";
  dictionary?: Record<string, string>;
  metadata?: {
    totalEntries: number;
    generatedAt: string;
    columns: string[];
  };
}

/**
 * Decodes a compressed visa data JSON file and returns the CSV content.
 * Expects gzip + Dictionary compression format by default.
 * @param jsonPath Path to the compressed JSON file
 * @returns Decoded CSV content as a string
 */
export async function decodeVisaData(jsonPath: string): Promise<string> {
  const jsonFile = Bun.file(jsonPath);
  
  if (!(await jsonFile.exists())) {
    throw new Error(`File not found: ${jsonPath}`);
  }
  
  const compressedData: CompressedVisaData = await jsonFile.json();
  
  // Validate the structure
  if (!compressedData.data || !compressedData.encoding || !compressedData.compression) {
    throw new Error('Invalid compressed data format');
  }
  
  // Step 1: Decode base64
  const compressedBuffer = Buffer.from(compressedData.data, 'base64');
  
  // Step 2: Decompress (primarily gzip, but supports brotli for backwards compatibility)
  let decompressedBuffer: Buffer;
  
  if (compressedData.compression === 'gzip') {
    decompressedBuffer = gunzipSync(compressedBuffer);
  } else if (compressedData.compression === 'brotli') {
    decompressedBuffer = brotliDecompressSync(compressedBuffer);
  } else {
    throw new Error(`Unsupported compression type: ${compressedData.compression}`);
  }
  
  let csvContent = decompressedBuffer.toString('utf-8');
  
  // Step 3: Apply reverse dictionary mapping (required for optimal compression)
  if (compressedData.dictionary) {
    csvContent = applyReverseDictionary(csvContent, compressedData.dictionary);
  }
  
  return csvContent;
}

/**
 * Applies reverse dictionary mapping to expand short codes back to full text
 * Also reconstructs run-length encoded citizenship_id values
 * @param csvContent CSV content with short codes
 * @param dictionary Reverse mapping from short codes to full text
 * @returns CSV content with full text
 */
function applyReverseDictionary(
  csvContent: string,
  dictionary: Record<string, string>
): string {
  const rows = csvContent.split('\n');
  const expandedRows = [rows[0]]; // Keep header
  
  let lastCitizenshipId = '';
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    
    const parts = row.split(',');
    if (parts.length >= 3) {
      let citizenshipId = parts[0];
      const destinationId = parts[1];
      const shortCode = parts.slice(2).join(','); // Handle commas in requirement
      
      // Reconstruct run-length encoded citizenship_id
      if (!citizenshipId && lastCitizenshipId) {
        citizenshipId = lastCitizenshipId;
      } else if (citizenshipId) {
        lastCitizenshipId = citizenshipId;
      }
      
      if (citizenshipId && destinationId && shortCode) {
        // Expand short code if it exists in dictionary
        const fullRequirement = dictionary[shortCode] || shortCode;
        
        // Re-escape if necessary (if it contains commas)
        const requirementField = fullRequirement.includes(',')
          ? `"${fullRequirement}"`
          : fullRequirement;
        
        expandedRows.push(`${citizenshipId},${destinationId},${requirementField}`);
      }
    } else {
      expandedRows.push(row);
    }
  }
  
  return expandedRows.join('\n');
}

/**
 * Parses decoded CSV content into structured data
 * Note: This expects fully decoded CSV (after applyReverseDictionary has been applied)
 * @param csvContent CSV content as a string
 * @returns Array of visa entry objects
 */
export function parseCSV(csvContent: string) {
  const rows = csvContent.split('\n');
  const entries: Array<{
    citizenshipId: string;
    destinationId: string;
    requirement: string;
  }> = [];
  
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    
    const parts = row.split(',');
    if (parts.length >= 3) {
      const citizenshipId = parts[0];
      const destinationId = parts[1];
      let requirement = parts.slice(2).join(','); // Handle commas in requirement
      
      // Remove quotes if present
      requirement = requirement?.replace(/^"(.*)"$/, '$1') || '';
      
      if (citizenshipId && destinationId) {
        entries.push({
          citizenshipId,
          destinationId,
          requirement,
        });
      }
    }
  }
  
  return entries;
}

// CLI functionality
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: bun decode-visa-data.ts [compressed-json-file] [output-csv-file]');
    console.log('\nExamples:');
    console.log('  bun decode-visa-data.ts');
    console.log('  bun decode-visa-data.ts ../data/output/compressed.json');
    console.log('  bun decode-visa-data.ts ../data/output/compressed.json decoded.csv');
    console.log('\nFormat: gzip + Dictionary + RLE + Base64 (browser-friendly compression)');
    process.exit(0);
  }
  
  // Default to compressed.json in data/output directory
  const inputPath = args[0] || `${import.meta.dir}/../data/output/compressed.json`;
  const outputPath = args[1];
  
  try {
    console.log(`🔓 Decoding ${inputPath}...`);
    
    const csvContent = await decodeVisaData(inputPath);
    
    if (outputPath) {
      await Bun.write(outputPath, csvContent);
      console.log(`✅ Decoded CSV saved to ${outputPath}`);
    } else {
      // Display first few lines as preview
      const lines = csvContent.split('\n').slice(0, 6);
      console.log('\n📄 Preview (first 5 entries):');
      console.log(lines.join('\n'));
      console.log('...');
      
      const totalLines = csvContent.split('\n').length;
      console.log(`\n📊 Total rows: ${totalLines} (including header)`);
      console.log(`📊 Total entries: ${totalLines - 1}`);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run main if this is the entry point
if (import.meta.main) {
  await main();
}

