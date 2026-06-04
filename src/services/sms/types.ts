import type { Category, TransactionType } from '@/types/transaction';

/** A raw SMS message as returned by the native reader. */
export interface SmsMessage {
  id: string;
  address: string;
  body: string;
  /** Epoch milliseconds the message was received. */
  date: number;
}

export type SmsProvider = 'MTN MoMo' | 'Telecel Cash' | 'AirtelTigo Cash' | 'Bank';

/** A financial SMS that was successfully parsed into transaction fields. */
export interface ParsedSms {
  smsId: string;
  provider: SmsProvider;
  type: TransactionType;
  amount: number;
  category: Category;
  merchant: string | null;
  /** ISO date string (from the message, or the received time as fallback). */
  date: string;
  raw: string;
}
