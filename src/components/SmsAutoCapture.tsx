import { useSmsAutoCapture } from '@/hooks/useSmsAutoCapture';

/** Headless component that runs SMS auto-capture while mounted. */
export function SmsAutoCapture() {
  useSmsAutoCapture();
  return null;
}
