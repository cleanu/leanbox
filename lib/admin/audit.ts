import "server-only";
import type { Json } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

/** Every admin write is recorded here. */
export async function audit(actorId: string, action: string, entity: string, entityId: string | null, meta: Record<string, Json | undefined> = {}) {
  const { error } = await createAdminClient()
    .from("admin_audit")
    .insert({ actor_id: actorId, action, entity, entity_id: entityId, meta: meta as Json });
  if (error) console.error("[audit] insert failed", error.message);
}
