export function sanitizeText(input: string, max = 500) {
  return input
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
