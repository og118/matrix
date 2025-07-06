export const placeholder = (width: number, height: number, text: string = ''): string => {
  return `https://placehold.co/${width}x${height}?text=${encodeURIComponent(text)}`
}
