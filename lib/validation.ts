import { z } from "zod";
import { isDistrictValue } from "./districts";
import { MEAL_TAGS } from "./tags";

/** Normalise HK numbers to "+852 XXXX XXXX". Accepts spaces, dashes, +852 / 852 prefix. */
export function normalizeHKPhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "").replace(/^852(?=\d{8}$)/, "");
  if (!/^[2-9]\d{7}$/.test(digits)) return null;
  return `+852 ${digits.slice(0, 4)} ${digits.slice(4)}`;
}

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email({ error: "invalidEmail" }));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "invalidCredentials" }).max(128),
  next: z.string().optional(),
});

export const signupSchema = z
  .object({
    name: optionalText(80),
    email: emailSchema,
    password: z.string().min(8, { error: "passwordTooShort" }).max(72, { error: "weakPassword" }),
    confirmPassword: z.string(),
    next: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { error: "passwordMismatch", path: ["confirmPassword"] });

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({
    password: z.string().min(8, { error: "passwordTooShort" }).max(72, { error: "weakPassword" }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { error: "passwordMismatch", path: ["confirmPassword"] });

// ---------------------------------------------------------------------------
// Cart / checkout / profile
// ---------------------------------------------------------------------------
export const cartLineSchema = z.object({
  mealId: z.uuid(),
  quantity: z.number().int().min(0).max(50),
});
export const cartLinesSchema = z.array(cartLineSchema).max(50);

const phoneField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const n = normalizeHKPhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "phone" });
      return z.NEVER;
    }
    return n;
  });

export const checkoutSchema = z.object({
  mode: z.enum(["cart", "plan"]),
  planId: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
  name: z.string().trim().min(1, { error: "name" }).max(80, { error: "name" }),
  phone: phoneField,
  district: z.string().refine(isDistrictValue, { error: "district" }),
  address: z.string().trim().min(4, { error: "address" }).max(200, { error: "address" }),
  notes: optionalText(300),
  week: z.string().regex(/^\d{4}-W\d{2}$/, { error: "week" }),
  saveDefault: checkbox,
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const profileSchema = z.object({
  full_name: optionalText(80),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    phoneField.optional(),
  ),
  district: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().refine(isDistrictValue, { error: "district" }).optional(),
  ),
  address_line: optionalText(200),
  notes: optionalText(300),
  contact_email: z.preprocess((v) => (v === "" ? undefined : v), emailSchema.optional()),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const orderStatusSchema = z.enum(ORDER_STATUSES);

const intField = (min = 0, max = 1_000_000) => z.coerce.number().int().min(min).max(max);
const hkdField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const cleaned = v.replace(/hk\$|\$|,|\s/gi, "");
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
      ctx.addIssue({ code: "custom", message: "金額格式不正確" });
      return z.NEVER;
    }
    return Math.round(Number(cleaned) * 100);
  });

export const mealFormSchema = z.object({
  id: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: "Slug 只可用小楷英文、數字及連字號" }),
  name_zh: z.string().trim().min(1, { error: "請輸入中文名稱" }).max(80),
  name_en: z.string().trim().min(1, { error: "請輸入英文名稱" }).max(80),
  description_zh: z.string().trim().max(600).default(""),
  description_en: z.string().trim().max(600).default(""),
  ingredients_zh: z.string().trim().max(600).default(""),
  ingredients_en: z.string().trim().max(600).default(""),
  allergens: z
    .string()
    .default("")
    .transform((v) => v.split(/[,，、]/).map((s) => s.trim()).filter(Boolean).slice(0, 12)),
  tags: z.array(z.enum(MEAL_TAGS.map((t) => t.value) as [string, ...string[]])).default([]),
  kcal: intField(0, 3000),
  protein_g: intField(0, 300),
  carbs_g: intField(0, 500),
  fat_g: intField(0, 300),
  price: hkdField,
  cost: hkdField,
  weekly_stock: intField(0, 10_000),
  sort_order: intField(-10_000, 10_000),
  is_active: checkbox,
  image_path: optionalText(500),
});

export const planFormSchema = z.object({
  id: z.uuid(),
  name_zh: z.string().trim().min(1).max(80),
  name_en: z.string().trim().min(1).max(80),
  description_zh: z.string().trim().max(400).default(""),
  description_en: z.string().trim().max(400).default(""),
  meals_per_week: intField(1, 50),
  price: hkdField,
  cost: hkdField,
  stripe_price_id: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v),
    z.string().regex(/^price_[A-Za-z0-9]+$/, { error: "Stripe Price ID 應以 price_ 開頭" }).nullable(),
  ),
  is_featured: checkbox,
  is_active: checkbox,
  sort_order: intField(-10_000, 10_000),
});

/** Flatten zod issues to { field: messageKey }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
