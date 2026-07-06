export interface Checkout {
  id: string;
  entity: string;
  livemode: boolean;
  amount: number;
  currency: string;
  fees: number;
  fees_on_merchant: number;
  fees_on_customer: number;
  pass_fees_to_customer: number | null;
  chargily_pay_fees_allocation: 'customer' | 'merchant' | 'split'; // note: this may have the value of 'expired' too. search more about it
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled';
  locale: 'ar' | 'en' | 'fr';
  description: string | null;
  metadata: any; //A Set of key-value pairs that can be used to store additional information about the checkout.
  success_url: string;
  failure_url: string;
  webhook_endpoint: string | null;
  payment_method: string | null;
  invoice_id: string | null;
  customer_id: string | null;
  payment_link_id: string | null;
  created_at: number;
  updated_at: number;
  shipping_address: string | null;
  collect_shipping_address: boolean | any;
  discount: {
    type: 'percentage' | 'amount';
    value: number;
  } | null;
  amount_without_discount: number | null;
  checkout_url: string;
}

// export type webhookCheckout = Omit<Checkout & { url: string }, 'checkout_url'>; note: we need to search more on this. This time on this project, I checked the checkout object returned by the webhook and it seemed like it is of Checkout. I did not verify every property, but I found checkout_url and did not find url
