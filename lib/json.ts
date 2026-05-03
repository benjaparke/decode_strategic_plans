export function parseJsonObject(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return valid JSON");
  return JSON.parse(raw.slice(start, end + 1));
}
