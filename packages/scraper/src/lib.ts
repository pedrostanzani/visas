import { countries } from "@visas/shared";
import { COUNTRY_NAME_EXCEPTIONS } from "@/constants/country-name-exceptions";

export async function fetchHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.text();
}

export function isTruthy<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function resolveCountryId(countryName: string): string | null {
  const cleanName = countryName.trim();
  
  // First, try exact case-insensitive match
  const exactMatch = countries.find(
    (c) => c.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (exactMatch) {
    return exactMatch.id;
  }
  
  // Then check country name exceptions
  const exceptionMatch = COUNTRY_NAME_EXCEPTIONS[cleanName as keyof typeof COUNTRY_NAME_EXCEPTIONS];
  if (exceptionMatch) {
    return exceptionMatch;
  }
  
  // Not found
  return null;
}