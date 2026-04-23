export function adjustColorBrightness(hex: string, brightness: number): string {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Apply brightness (0 to 2 range, where 1 is neutral)
  r = Math.min(255, Math.max(0, Math.round(r * brightness)));
  g = Math.min(255, Math.max(0, Math.round(g * brightness)));
  b = Math.min(255, Math.max(0, Math.round(b * brightness)));

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
