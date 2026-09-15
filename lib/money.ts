export function centsToReaisInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return "";
  }
  return (cents / 100).toFixed(2);
}

export function reaisInputToCents(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(",", ".");
  const reais = Number.parseFloat(normalized);
  if (Number.isNaN(reais)) {
    return null;
  }
  return Math.round(reais * 100);
}
