import type { CreateTransactionPayload } from '@/types/transaction';

import type { ParsedSms } from './types';

/** Maps a parsed SMS to the payload expected by the transactions API. */
export function toCreatePayload(parsed: ParsedSms): CreateTransactionPayload {
  const note = parsed.merchant ? `${parsed.merchant} · ${parsed.provider}` : parsed.provider;
  return {
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.category,
    note,
    date: parsed.date,
  };
}
