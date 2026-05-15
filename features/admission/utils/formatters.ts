export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

export function formatCvv(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\s/g, '');
  if (digits.length < 4) return cardNumber;
  return '**** **** **** ' + digits.slice(-4);
}