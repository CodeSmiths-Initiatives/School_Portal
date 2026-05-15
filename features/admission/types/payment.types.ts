export type PaymentMethod = 'card' | 'bank_transfer' | 'ussd';

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
}

export interface BankTransferDetails {
  bankName: string;
  accountNumber: string;
  reference: string;
}

export interface UssdDetails {
  network: string;
}

export interface FeeBreakdown {
  programme: string;
  applicationFee: number;
  bankCharges: number;
}

export interface PaymentFormData {
  method: PaymentMethod;
  card: CardDetails;
  bankTransfer: BankTransferDetails;
  ussd: UssdDetails;
}