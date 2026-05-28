import { redirect } from "next/navigation";
import { ADMIN_ROUTE_ALIASES } from "@/lib/utils/admin-route-aliases";

export default function SeoOutreachRedirect() {
  redirect(ADMIN_ROUTE_ALIASES.seoOutreach);
}
