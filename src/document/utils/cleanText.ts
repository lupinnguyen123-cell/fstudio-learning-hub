export function cleanText(value: string): string {
  return value.normalize('NFC').replace(/\u00a0/g, ' ').replace(/[\t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}
export const cleanLine = (value: string) => value.normalize('NFC').replace(/\u00a0/g, ' ').replace(/[\t ]+/g, ' ').trim()
export const cleanBullet = (value: string) => cleanLine(value.replace(/^[•●▪◦‣–—]\s*/, ''))
