export function createId(prefix = ''): string {
  const value = crypto.randomUUID();
  return prefix ? `${prefix}_${value}` : value;
}
