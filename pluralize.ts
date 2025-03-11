export function pluralize(num: number, words: string[]) {
  const count = Math.abs(Number(num))
  const cases = [2, 0, 1, 1, 1, 2]

  return `${count} ${words[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]]}`
}

export const pluralizeOptions = {
  day: ['день', 'дня', 'дней'],
  year: ['год', 'года', 'лет'],
}
