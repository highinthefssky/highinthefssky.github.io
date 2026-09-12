const SETTINGS_TYPE_LABELS = new Map<string, string>([
  ['gc', 'General Controls'],
  ['hc', 'Helicopter Controls'],
]);

const SETTINGS_TYPE_CODES = new Map<string, string>([
  ...Array.from(SETTINGS_TYPE_LABELS.keys(), (code) => [code, code] as const),
  ...Array.from(SETTINGS_TYPE_LABELS, ([code, label]) => [label.toLowerCase(), code] as const),
]);

/**
 * Returns a stable settings type code for either a code (`gc`) or label (`General Controls`).
 * Unknown values fall back to the trimmed, lowercased input.
 */
export function getSettingsTypeCode(value: string): string {
  const normalized = value.trim().toLowerCase();
  return SETTINGS_TYPE_CODES.get(normalized) || normalized;
}

/**
 * Returns the canonical display label for a settings type code or label.
 * Unknown values fall back to the original input.
 */
export function formatSettingsType(value: string): string {
  return SETTINGS_TYPE_LABELS.get(getSettingsTypeCode(value)) || value;
}
