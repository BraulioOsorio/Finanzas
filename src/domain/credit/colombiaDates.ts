export function parseIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}