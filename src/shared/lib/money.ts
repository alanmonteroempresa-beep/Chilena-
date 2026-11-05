// Dinero SIEMPRE en centavos (Int) y MXN. La app nunca procesa pagos (PRD §8.7).
const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function formatMXN(cents: number): string {
  if (!Number.isInteger(cents)) throw new Error("El dinero se maneja en centavos enteros");
  return mxn.format(cents / 100);
}

export function pesosToCents(pesos: number): number {
  return Math.round(pesos * 100);
}
