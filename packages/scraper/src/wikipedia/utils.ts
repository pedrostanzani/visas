import * as cheerio from "cheerio";
import type { Element } from "domhandler";

export function findSectionName($element: cheerio.Cheerio<Element>): {
  section: string;
  subsection: string;
} {
  // Traverse backwards to find the nearest heading (h2 or h3)
  let current = $element;
  let h3Section = "";
  let h2Section = "";

  // Look for the nearest h3 first (subsection)
  const prevH3Div = current.prevAll(".mw-heading.mw-heading3").first();
  if (prevH3Div.length > 0) {
    const h3 = prevH3Div.find("h3");
    if (h3.length > 0) {
      h3Section =
        h3.find(".mw-headline").text().trim() ||
        h3
          .text()
          .trim()
          .replace(/\[edit\]$/, "")
          .trim();
    }
  }

  // Look for the nearest h2 (main section)
  const prevH2Div = current.prevAll(".mw-heading.mw-heading2").first();
  if (prevH2Div.length > 0) {
    const h2 = prevH2Div.find("h2");
    if (h2.length > 0) {
      h2Section =
        h2.find(".mw-headline").text().trim() ||
        h2
          .text()
          .trim()
          .replace(/\[edit\]$/, "")
          .trim();
    }
  }

  // If not found in siblings, traverse up and check parent's previous siblings
  if (!h2Section && !h3Section) {
    let parent = current.parent();
    while (parent.length > 0 && parent.prop("tagName") !== "BODY") {
      if (!h3Section) {
        const prevH3InParent = parent
          .prevAll(".mw-heading.mw-heading3")
          .first();
        if (prevH3InParent.length > 0) {
          const h3 = prevH3InParent.find("h3");
          if (h3.length > 0) {
            h3Section =
              h3.find(".mw-headline").text().trim() ||
              h3
                .text()
                .trim()
                .replace(/\[edit\]$/, "")
                .trim();
          }
        }
      }

      if (!h2Section) {
        const prevH2InParent = parent
          .prevAll(".mw-heading.mw-heading2")
          .first();
        if (prevH2InParent.length > 0) {
          const h2 = prevH2InParent.find("h2");
          if (h2.length > 0) {
            h2Section =
              h2.find(".mw-headline").text().trim() ||
              h2
                .text()
                .trim()
                .replace(/\[edit\]$/, "")
                .trim();
          }
        }
      }

      if (h2Section) break;
      parent = parent.parent();
    }
  }

  // Return structured section object
  return {
    section: h2Section || h3Section || "Unknown section",
    subsection: h2Section && h3Section ? h3Section : "",
  };
}

export function findColumnIndex(
  headers: string[],
  variations: string[]
): number | null {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]?.trim();
    if (variations.some((v) => v === header)) {
      return i;
    }
  }
  return null;
}

// Clean text by removing citation markers
export function removeCitationMarkers(text: string): string {
  return text
    .replace(/\[\d+\]/g, "") // Remove [1], [2], etc.
    .replace(/\[citation needed\]/gi, "")
    .replace(/\[.*?\]/g, "") // Remove any other bracketed content
    .trim();
}
