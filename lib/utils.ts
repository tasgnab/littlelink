
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

export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

export function getFaviconUrl(url: string, size: number = 32): string {
  const domain = extractDomain(url);
  if (!domain) {
    return "";
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

interface BrandColor {
  bg: string;
  bgDark: string;
  text: string;
  textDark: string;
  gradient?: boolean;
}

const brandColors: Record<string, BrandColor> = {
  // Social Media
  'twitter.com': { bg: '#1DA1F2', bgDark: '#1A8CD8', text: '#FFFFFF', textDark: '#FFFFFF' },
  'x.com': { bg: '#000000', bgDark: '#1A1A1A', text: '#FFFFFF', textDark: '#FFFFFF' },
  'threads.net': { bg: '#000000', bgDark: '#1A1A1A', text: '#FFFFFF', textDark: '#FFFFFF' },
  'facebook.com': { bg: '#1877F2', bgDark: '#166FE5', text: '#FFFFFF', textDark: '#FFFFFF' },
  'instagram.com': { bg: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', bgDark: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', text: '#FFFFFF', textDark: '#FFFFFF', gradient: true },
  'linkedin.com': { bg: '#0A66C2', bgDark: '#004182', text: '#FFFFFF', textDark: '#FFFFFF' },
  'youtube.com': { bg: '#FF0000', bgDark: '#CC0000', text: '#FFFFFF', textDark: '#FFFFFF' },
  'tiktok.com': { bg: '#000000', bgDark: '#1A1A1A', text: '#FFFFFF', textDark: '#FFFFFF' },
  'reddit.com': { bg: '#FF4500', bgDark: '#E03D00', text: '#FFFFFF', textDark: '#FFFFFF' },
  'pinterest.com': { bg: '#E60023', bgDark: '#BD081C', text: '#FFFFFF', textDark: '#FFFFFF' },
  'snapchat.com': { bg: '#FFFC00', bgDark: '#E6E300', text: '#000000', textDark: '#000000' },
  'whatsapp.com': { bg: '#25D366', bgDark: '#1DA851', text: '#FFFFFF', textDark: '#FFFFFF' },
  'telegram.org': { bg: '#26A5E4', bgDark: '#1E8BC3', text: '#FFFFFF', textDark: '#FFFFFF' },
  't.me': { bg: '#26A5E4', bgDark: '#1E8BC3', text: '#FFFFFF', textDark: '#FFFFFF' },
  'discord.com': { bg: '#5865F2', bgDark: '#4752C4', text: '#FFFFFF', textDark: '#FFFFFF' },
  'twitch.tv': { bg: '#9146FF', bgDark: '#772CE8', text: '#FFFFFF', textDark: '#FFFFFF' },

  // Dev Platforms
  'github.com': { bg: '#181717', bgDark: '#0D1117', text: '#FFFFFF', textDark: '#FFFFFF' },
  'gitlab.com': { bg: '#FC6D26', bgDark: '#E24329', text: '#FFFFFF', textDark: '#FFFFFF' },
  'stackoverflow.com': { bg: '#F48024', bgDark: '#DA6A17', text: '#FFFFFF', textDark: '#FFFFFF' },
  'dev.to': { bg: '#0A0A0A', bgDark: '#000000', text: '#FFFFFF', textDark: '#FFFFFF' },
  'medium.com': { bg: '#000000', bgDark: '#1A1A1A', text: '#FFFFFF', textDark: '#FFFFFF' },
  'codepen.io': { bg: '#000000', bgDark: '#1A1A1A', text: '#FFFFFF', textDark: '#FFFFFF' },

  // Professional/Business
  'notion.so': { bg: '#000000', bgDark: '#1A1A1A', text: '#FFFFFF', textDark: '#FFFFFF' },
  'figma.com': { bg: '#F24E1E', bgDark: '#D73E0E', text: '#FFFFFF', textDark: '#FFFFFF' },
  'behance.net': { bg: '#1769FF', bgDark: '#0057E7', text: '#FFFFFF', textDark: '#FFFFFF' },
  'dribbble.com': { bg: '#EA4C89', bgDark: '#C32361', text: '#FFFFFF', textDark: '#FFFFFF' },
  'substack.com': { bg: '#FF6719', bgDark: '#E64F00', text: '#FFFFFF', textDark: '#FFFFFF' },

  // Music/Entertainment
  'spotify.com': { bg: '#1DB954', bgDark: '#1AA34A', text: '#FFFFFF', textDark: '#FFFFFF' },
  'soundcloud.com': { bg: '#FF5500', bgDark: '#E64900', text: '#FFFFFF', textDark: '#FFFFFF' },
  'apple.com': { bg: '#000000', bgDark: '#1A1A1A', text: '#FFFFFF', textDark: '#FFFFFF' },
  'music.apple.com': { bg: '#FA243C', bgDark: '#D91F34', text: '#FFFFFF', textDark: '#FFFFFF' },

  // Gaming
  'steampowered.com': { bg: 'linear-gradient(135deg, #06BFFF 0%, #2D73FF 100%)', bgDark: 'linear-gradient(135deg, #06BFFF 0%, #2D73FF 100%)', text: '#FFFFFF', textDark: '#FFFFFF', gradient: true },
  'store.steampowered.com': { bg: 'linear-gradient(135deg, #06BFFF 0%, #2D73FF 100%)', bgDark: 'linear-gradient(135deg, #06BFFF 0%, #2D73FF 100%)', text: '#FFFFFF', textDark: '#FFFFFF', gradient: true },

  // Shopping
  'amazon.com': { bg: '#FF9900', bgDark: '#E68A00', text: '#000000', textDark: '#000000' },
  'etsy.com': { bg: '#F56400', bgDark: '#DC5700', text: '#FFFFFF', textDark: '#FFFFFF' },
  'shopify.com': { bg: '#96BF48', bgDark: '#7FAB3D', text: '#FFFFFF', textDark: '#FFFFFF' },

  // Other
  'patreon.com': { bg: '#FF424D', bgDark: '#E63946', text: '#FFFFFF', textDark: '#FFFFFF' },
  'ko-fi.com': { bg: '#FF5E5B', bgDark: '#E64A47', text: '#FFFFFF', textDark: '#FFFFFF' },
  'buymeacoffee.com': { bg: '#FFDD00', bgDark: '#E6C700', text: '#000000', textDark: '#000000' },
  'paypal.com': { bg: '#00457C', bgDark: '#003366', text: '#FFFFFF', textDark: '#FFFFFF' },
  'cash.app': { bg: '#00D632', bgDark: '#00B82A', text: '#FFFFFF', textDark: '#FFFFFF' },
  'venmo.com': { bg: '#3D95CE', bgDark: '#2E7AB8', text: '#FFFFFF', textDark: '#FFFFFF' },
};

export function getBrandColors(url: string): BrandColor {
  const domain = extractDomain(url);
  if (!domain) {
    return {
      bg: '#FFFFFF',
      bgDark: '#1F2937',
      text: '#111827',
      textDark: '#FFFFFF',
    };
  }

  // Check exact domain match
  if (brandColors[domain]) {
    return brandColors[domain];
  }

  // Check without www prefix
  const domainWithoutWww = domain.replace(/^www\./, '');
  if (brandColors[domainWithoutWww]) {
    return brandColors[domainWithoutWww];
  }

  // Default fallback
  return {
    bg: '#FFFFFF',
    bgDark: '#1F2937',
    text: '#111827',
    textDark: '#FFFFFF',
  };
}