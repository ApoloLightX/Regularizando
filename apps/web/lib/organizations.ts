import "server-only";

import { createClient } from "@/lib/supabase/server";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
};

export async function listOrganizations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("id,name,slug")
    .order("name");

  return (data ?? []) as OrganizationSummary[];
}

export async function resolveOrganization(requestedId?: string) {
  const organizations = await listOrganizations();
  const selected =
    organizations.find(({ id }) => id === requestedId) ?? organizations[0];
  return { organizations, selected };
}
