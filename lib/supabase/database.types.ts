/**
 * Typed schema for the LeanBox database (mirrors supabase/migrations).
 * Regenerate from a live project with:
 *   npx supabase gen types typescript --project-id <ref> --schema public > lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export type Database = {
  __InternalSupabase: { PostgrestVersion: "13" };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          contact_email: string | null;
          full_name: string | null;
          phone: string | null;
          district: string | null;
          address_line: string | null;
          notes: string | null;
          avatar_url: string | null;
          apple_user_id: string | null;
          stripe_customer_id: string | null;
          role: "customer" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          contact_email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          district?: string | null;
          address_line?: string | null;
          notes?: string | null;
          avatar_url?: string | null;
          apple_user_id?: string | null;
          stripe_customer_id?: string | null;
          role?: "customer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      meals: {
        Row: {
          id: string;
          slug: string;
          name_zh: string;
          name_en: string;
          description_zh: string;
          description_en: string;
          ingredients_zh: string;
          ingredients_en: string;
          allergens: string[];
          kcal: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          tags: string[];
          price_cents: number;
          cost_cents: number;
          image_path: string | null;
          is_active: boolean;
          weekly_stock: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_zh: string;
          name_en: string;
          description_zh?: string;
          description_en?: string;
          ingredients_zh?: string;
          ingredients_en?: string;
          allergens?: string[];
          kcal?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          tags?: string[];
          price_cents: number;
          cost_cents?: number;
          image_path?: string | null;
          is_active?: boolean;
          weekly_stock?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meals"]["Insert"]>;
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          slug: string;
          name_zh: string;
          name_en: string;
          description_zh: string;
          description_en: string;
          meals_per_week: number;
          price_cents: number;
          cost_cents: number;
          stripe_price_id: string | null;
          is_featured: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_zh: string;
          name_en: string;
          description_zh?: string;
          description_en?: string;
          meals_per_week: number;
          price_cents: number;
          cost_cents?: number;
          stripe_price_id?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
        Relationships: [];
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          status: "active" | "converted";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          status?: "active" | "converted";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["carts"]["Insert"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          cart_id: string;
          meal_id: string;
          quantity: number;
          unit_price_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          cart_id: string;
          meal_id: string;
          quantity: number;
          unit_price_cents: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "cart_items_cart_id_fkey"; columns: ["cart_id"]; isOneToOne: false; referencedRelation: "carts"; referencedColumns: ["id"] },
          { foreignKeyName: "cart_items_meal_id_fkey"; columns: ["meal_id"]; isOneToOne: false; referencedRelation: "meals"; referencedColumns: ["id"] },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          user_id: string | null;
          cart_id: string | null;
          plan_id: string | null;
          kind: "one_time" | "subscription";
          status: OrderStatus;
          fulfillment_week: string;
          subtotal_cents: number;
          delivery_cents: number;
          discount_cents: number;
          total_cents: number;
          refunded_cents: number;
          currency: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_subscription_id: string | null;
          stripe_invoice_id: string | null;
          payment_error: string | null;
          customer_email: string | null;
          delivery_name: string;
          delivery_phone: string;
          delivery_district: string;
          delivery_address: string;
          delivery_notes: string | null;
          paid_at: string | null;
          cancelled_at: string | null;
          delivered_at: string | null;
          refunded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          cart_id?: string | null;
          plan_id?: string | null;
          kind?: "one_time" | "subscription";
          status?: OrderStatus;
          fulfillment_week: string;
          subtotal_cents?: number;
          delivery_cents?: number;
          discount_cents?: number;
          total_cents?: number;
          refunded_cents?: number;
          currency?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_invoice_id?: string | null;
          payment_error?: string | null;
          customer_email?: string | null;
          delivery_name: string;
          delivery_phone: string;
          delivery_district: string;
          delivery_address: string;
          delivery_notes?: string | null;
          paid_at?: string | null;
          cancelled_at?: string | null;
          delivered_at?: string | null;
          refunded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "orders_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "plans"; referencedColumns: ["id"] },
          { foreignKeyName: "orders_cart_id_fkey"; columns: ["cart_id"]; isOneToOne: false; referencedRelation: "carts"; referencedColumns: ["id"] },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          meal_id: string | null;
          plan_id: string | null;
          name_snapshot: string;
          name_en_snapshot: string | null;
          quantity: number;
          unit_price_cents: number;
          unit_cost_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          meal_id?: string | null;
          plan_id?: string | null;
          name_snapshot: string;
          name_en_snapshot?: string | null;
          quantity: number;
          unit_price_cents: number;
          unit_cost_cents?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "order_items_meal_id_fkey"; columns: ["meal_id"]; isOneToOne: false; referencedRelation: "meals"; referencedColumns: ["id"] },
          { foreignKeyName: "order_items_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "plans"; referencedColumns: ["id"] },
        ];
      };
      order_notes: {
        Row: { id: string; order_id: string; author_id: string | null; body: string; created_at: string };
        Insert: { id?: string; order_id: string; author_id?: string | null; body: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["order_notes"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "order_notes_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string | null;
          plan_id: string | null;
          stripe_subscription_id: string;
          stripe_customer_id: string | null;
          status: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          plan_id?: string | null;
          stripe_subscription_id: string;
          stripe_customer_id?: string | null;
          status: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "subscriptions_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "plans"; referencedColumns: ["id"] },
        ];
      };
      stripe_events: {
        Row: { id: string; type: string; received_at: string; processed_at: string | null };
        Insert: { id: string; type: string; received_at?: string; processed_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["stripe_events"]["Insert"]>;
        Relationships: [];
      };
      admin_audit: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_audit"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      fulfill_order: {
        Args: { p_order_id: string; p_payment_intent?: string | null; p_subscription?: string | null };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicTables = Database["public"]["Tables"];
export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"];
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"];
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]["Update"];
