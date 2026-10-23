export function serializeJson(value: unknown): string {
  const json = JSON.stringify(value);
  if (json === undefined) throw new TypeError('Value cannot be serialized as JSON');
  return json.replaceAll('<', '\\u003c');
}
