/**
 * The seed files author their own `accentColor`, which is right — the data owns
 * its identity. But two of them land badly on a dark board: Car Brands ships
 * `#1D1D1F`, which is effectively invisible against the table background.
 *
 * Rather than overriding the authored values, derive a legible variant for use
 * on dark surfaces. Adding a sixth category with any accent then needs no
 * special-casing.
 */

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const part = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** WCAG relative luminance. */
function luminance(rgb: Rgb): number {
  const channel = (raw: number) => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [luminance(hexToRgb(a)), luminance(hexToRgb(b))];
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  };
}

/**
 * Lightens `accent` toward white only as far as it takes to clear `minContrast`
 * against `background`. Accents that already pass come back untouched.
 */
export function readableOn(accent: string, background: string, minContrast = 3.2): string {
  if (contrastRatio(accent, background) >= minContrast) return accent;

  const base = hexToRgb(accent);
  const white: Rgb = { r: 255, g: 255, b: 255 };
  for (let amount = 0.05; amount <= 1; amount += 0.05) {
    const candidate = rgbToHex(mix(base, white, amount));
    if (contrastRatio(candidate, background) >= minContrast) return candidate;
  }
  return "#FFFFFF";
}
