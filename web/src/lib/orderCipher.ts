// SOULDAWN Order Cipher System
// Format: SD-XXXX-XXXX
// Where X = alphanumeric characters derived from order data + randomization

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function encodeSegment(value: number, length: number): string {
  let result = "";
  let val = Math.abs(value);
  for (let i = 0; i < length; i++) {
    result += CHARS[val % CHARS.length];
    val = Math.floor(val / CHARS.length);
  }
  return result;
}

/**
 * Generate a unique order cipher.
 * Format: SD-GGGG-SSSS
 * G = group (date-based part)
 * S = serial (sequential-ish part)
 */
export function generateOrderCipher(): string {
  const now = new Date();

  // Group: day of year + hour of day encoded
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const hourOfDay = now.getHours();
  const groupVal = dayOfYear * 24 + hourOfDay;

  // Serial: minutes + seconds + random chars
  const serialVal = now.getMinutes() * 60 + now.getSeconds();

  const group = encodeSegment(groupVal, 4).padEnd(4, randomChar()).slice(0, 4);
  const serial = encodeSegment(serialVal, 2) + randomChar() + randomChar();

  return `SD-${group}-${serial}`;
}

/**
 * Decode an order cipher to extract approximate creation time.
 * Not cryptographically secure — just for display/admin purposes.
 */
export function decodeOrderCipher(cipher: string): { dayOfYear: number; hourOfDay: number; minuteSecond: number } | null {
  const match = cipher.match(/^SD-([A-Z2-9]{4})-([A-Z2-9]{4})$/);
  if (!match) return null;

  function decodeSegment(seg: string): number {
    let val = 0;
    for (let i = seg.length - 1; i >= 0; i--) {
      const idx = CHARS.indexOf(seg[i]);
      if (idx === -1) return 0;
      val = val * CHARS.length + idx;
    }
    return val;
  }

  const groupVal = decodeSegment(match[1]);
  const serialVal = decodeSegment(match[2]);

  return {
    dayOfYear: Math.floor(groupVal / 24),
    hourOfDay: groupVal % 24,
    minuteSecond: serialVal,
  };
}