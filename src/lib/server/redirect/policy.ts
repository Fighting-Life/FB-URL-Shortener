import ipaddr from 'ipaddr.js';
import UAParser from 'ua-parser-js';

export function buildDestinationUrl(
  destination: string,
  incoming: URLSearchParams,
  config: {
    forwardQuery: 'all' | 'allowlist' | 'none';
    forwardQueryKeys: string[];
    queryConflict: 'destination_wins' | 'incoming_wins';
  }
): string {
  const url = new URL(destination);
  if (config.forwardQuery === 'none') return url.toString();

  const destinationKeys = new Set(url.searchParams.keys());
  const allowedKeys = new Set(config.forwardQueryKeys);
  const forwarded = [...incoming].filter(
    ([key]) => config.forwardQuery === 'all' || allowedKeys.has(key)
  );
  // Resolve conflicts per key, not per value, so neither side loses its duplicates.
  if (config.queryConflict === 'incoming_wins') {
    for (const key of new Set(forwarded.map(([key]) => key))) url.searchParams.delete(key);
  }
  for (const [key, value] of forwarded) {
    if (config.queryConflict === 'incoming_wins' || !destinationKeys.has(key)) {
      url.searchParams.append(key, value);
    }
  }
  return url.toString();
}

// These names are spoofable metadata-preview hints, never authorization or reviewer routing.
const PREVIEW_UA =
  /\b(?:facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|slackbot(?:-linkexpanding)?|discordbot|linkedinbot)\b/i;
const AUTOMATION_UA =
  /\b(?:bot|crawler|spider|headlesschrome|puppeteer|playwright|curl|wget|python-requests|python-urllib|httpclient|go-http-client)\b|\b[a-z0-9_-]*(?:bot|crawler|spider)\b/i;

export function classifyVisitor(headers: Headers): {
  device: string;
  browser: string;
  os: string | null;
  isInApp: boolean;
  isPreview: boolean;
  isBot: boolean;
  botScore: number;
} {
  const ua = headers.get('user-agent')?.trim() ?? '';
  const parsed = new UAParser(ua).getResult();
  const isInstagram = /\bInstagram\b/i.test(ua);
  const isFacebook = /\b(?:FBAN|FBAV|FB_IAB)\b/i.test(ua);
  const isInApp = isInstagram || isFacebook || /\b(?:wv|MicroMessenger|Line|TikTok)\b/i.test(ua);
  const name = parsed.browser.name?.toLowerCase() ?? '';
  let browser = 'other';
  if (isInstagram) browser = 'instagram_in_app';
  else if (isFacebook) browser = 'facebook_in_app';
  else if (name.includes('edge')) browser = 'edge';
  else if (name.includes('samsung')) browser = 'samsung';
  else if (name.includes('opera')) browser = 'opera';
  else if (name.includes('firefox')) browser = 'firefox';
  else if (name.includes('chrome') || name === 'chromium') browser = 'chrome';
  else if (name.includes('safari')) browser = 'safari';

  const os = parsed.os.name ?? null;
  let device = 'unknown';
  if (parsed.device.type === 'mobile' || parsed.device.type === 'tablet') {
    device = parsed.device.type;
  } else if (parsed.device.type === 'smarttv') {
    device = 'tv';
  } else if (
    !parsed.device.type &&
    os &&
    /^(?:Windows|Mac OS|Linux|Ubuntu|Chrome OS|Chromium OS)$/i.test(os)
  ) {
    device = 'desktop';
  }

  const isPreview = PREVIEW_UA.test(ua);
  // Transparent 0–100 heuristic: missing UA 60, named automation/preview 80,
  // missing Accept-Language 10, no Sec-Fetch headers 10. Missing headers alone
  // never classify a normal browser as a bot. No IP reputation or hidden routing.
  let botScore = ua ? 0 : 60;
  if (isPreview || AUTOMATION_UA.test(ua)) botScore += 80;
  if (!headers.get('accept-language')?.trim()) botScore += 10;
  if (
    !['sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'sec-fetch-user'].some((key) =>
      headers.get(key)?.trim()
    )
  )
    botScore += 10;
  botScore = Math.min(100, botScore);

  return { device, browser, os, isInApp, isPreview, isBot: botScore >= 60, botScore };
}

function parseIp(value: string): ipaddr.IPv4 | ipaddr.IPv6 | null {
  const ip = value.trim();
  // Accept address literals only, not ports, brackets, zone IDs, lists, or legacy
  // inet_aton shorthand/octal/hex IPv4 spellings that can disagree across systems.
  if (!ip || /[\s%\[\]/,]/.test(ip)) return null;
  if (ip.includes('.')) {
    const dotted = ip.slice(ip.lastIndexOf(':') + 1);
    if (!/^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(dotted)) return null;
  } else if (!ip.includes(':')) return null;
  try {
    return ipaddr.parse(ip);
  } catch {
    return null;
  }
}

export function normalizeIp(ip: string): string | null {
  const parsed = parseIp(ip);
  if (!parsed) return null;
  return parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()
    ? parsed.toIPv4Address().toString()
    : parsed.toString();
}

export function matchesIp(ip: string | null, rule: string): boolean {
  if (ip === null) return false;
  const normalized = normalizeIp(ip);
  if (!normalized) return false;
  const parts = rule.trim().split('/');
  if (parts.length === 1) return normalized === normalizeIp(parts[0]);
  if (parts.length !== 2 || !/^\d{1,3}$/.test(parts[1])) return false;
  const network = parseIp(parts[0]);
  if (!network) return false;
  const prefix = Number(parts[1]);
  let address = ipaddr.parse(normalized);
  if (network instanceof ipaddr.IPv4) {
    return address instanceof ipaddr.IPv4 && prefix <= 32 && address.match(network, prefix);
  }
  if (prefix > 128) return false;
  // Keep the original IPv6 mask (including prefixes below /96) for mapped CIDRs.
  if (network.isIPv4MappedAddress() && address instanceof ipaddr.IPv4) {
    address = address.toIPv4MappedAddress();
  }
  return address instanceof ipaddr.IPv6 && address.match(network, prefix);
}

export function evaluateRules(
  rules: Array<{
    type: 'geo' | 'ip' | 'device' | 'browser';
    mode: 'allow' | 'deny';
    values: string[];
  }>,
  visitor: { ip: string | null; country: string | null; device: string; browser: string },
  globalBlockedIps: string[] = []
): 'blocked_ip' | 'blocked_geo' | 'blocked_device' | 'blocked_browser' | null {
  if (globalBlockedIps.some((rule) => matchesIp(visitor.ip, rule))) return 'blocked_ip';
  for (const type of ['ip', 'geo', 'device', 'browser'] as const) {
    for (const rule of rules) {
      if (rule.type !== type || rule.values.length === 0) continue;
      const value = type === 'geo' ? visitor.country : type === 'ip' ? visitor.ip : visitor[type];
      const matched = rule.values.some((entry) =>
        type === 'ip'
          ? matchesIp(visitor.ip, entry)
          : value !== null && value.trim().toLowerCase() === entry.trim().toLowerCase()
      );
      if (rule.mode === 'allow' ? !matched : matched) return `blocked_${type}`;
    }
  }
  return null;
}

export function eligibleDestinations<
  T extends {
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    clickCap: number | null;
    clickCount: number;
  }
>(rows: T[], now: number): T[] {
  return rows.filter(
    (row) =>
      Number.isFinite(now) &&
      row.isActive &&
      (row.startsAt === null || row.startsAt.getTime() <= now) &&
      (row.endsAt === null || now < row.endsAt.getTime()) &&
      (row.clickCap === null || row.clickCount < row.clickCap)
  );
}

/** Pass already eligible rows; inject random in [0, 1) for deterministic selection. */
export function selectDestination<
  T extends { id: string; priority: number; weight: number; sortOrder: number }
>(
  rows: T[],
  strategy: 'equal' | 'percentage' | 'priority',
  options: { sequence?: number; random?: number; stickyId?: string } = {}
): T | null {
  const candidates = rows
    .filter((row) => strategy !== 'percentage' || (Number.isFinite(row.weight) && row.weight > 0))
    .sort(
      (a, b) =>
        (strategy === 'priority' ? a.priority - b.priority : 0) ||
        a.sortOrder - b.sortOrder ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    );
  if (candidates.length === 0) return null;
  const sticky = candidates.find((row) => row.id === options.stickyId);
  if (sticky) return sticky;
  if (strategy === 'priority') return candidates[0];
  if (strategy === 'equal' && Number.isSafeInteger(options.sequence) && options.sequence! > 0) {
    return candidates[(options.sequence! - 1) % candidates.length];
  }

  const random = options.random ?? Math.random();
  if (!Number.isFinite(random) || random < 0 || random >= 1) {
    throw new RangeError('random must be a finite number in [0, 1)');
  }
  if (strategy === 'equal') return candidates[Math.floor(random * candidates.length)];

  // Scaling before summation also prevents overflow for large finite weights.
  const maxWeight = Math.max(...candidates.map((row) => row.weight));
  const total = candidates.reduce((sum, row) => sum + row.weight / maxWeight, 0);
  let remaining = random * total;
  for (const row of candidates) {
    remaining -= row.weight / maxWeight;
    if (remaining < 0) return row;
  }
  return candidates[candidates.length - 1];
}
