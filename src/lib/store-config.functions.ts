import { createServerFn } from "@tanstack/react-start";

export type StoreConfig = {
  delivery: {
    inside_dhaka_fee: number;
    outside_dhaka_fee: number;
    free_delivery_min: number;
    dhaka_estimate_hours: number;
    outside_estimate_hours: number;
  };
  bkash_number: string | null;
  nagad_number: string | null;
  contact: { phone: string | null; email: string | null; address: string | null };
};

const DEFAULTS: StoreConfig = {
  delivery: {
    inside_dhaka_fee: 80,
    outside_dhaka_fee: 150,
    free_delivery_min: 5000,
    dhaka_estimate_hours: 48,
    outside_estimate_hours: 72,
  },
  bkash_number: null,
  nagad_number: null,
  contact: { phone: null, email: null, address: null },
};

/**
 * Public, non-sensitive store configuration (delivery fees, payment numbers,
 * contact info). Read with the admin client inside the handler because the
 * settings table deliberately has no anon grant; only whitelisted fields
 * are returned.
 */
export const getStoreConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreConfig> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("settings").select("key, value");
    if (error) return DEFAULTS;

    const map = new Map((data ?? []).map((r) => [r.key, r.value] as const));
    const delivery = (map.get("delivery") ?? {}) as Partial<StoreConfig["delivery"]>;
    const bkash = (map.get("bkash") ?? {}) as { number?: string | null };
    const nagad = (map.get("nagad") ?? {}) as { number?: string | null };
    const contact = (map.get("contact") ?? {}) as Partial<StoreConfig["contact"]>;

    return {
      delivery: { ...DEFAULTS.delivery, ...delivery },
      bkash_number: bkash.number ?? null,
      nagad_number: nagad.number ?? null,
      contact: { ...DEFAULTS.contact, ...contact },
    };
  }
);
