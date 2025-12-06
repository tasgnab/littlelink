
import UAParser from "ua-parser-js";


export function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    device: result.device.type || "desktop",
    browser: result.browser.name || "unknown",
    os: result.os.name || "unknown",
  };
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}