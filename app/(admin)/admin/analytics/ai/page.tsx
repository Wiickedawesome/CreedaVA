import { redirect } from "next/navigation";
import { ADMIN_ROUTE_ALIASES } from "@/lib/utils/admin-route-aliases";

// AI Activity / the former AI Dashboard now live as Creeda AI in the SEO Hub.
export default function AIActivityRedirect() {
  redirect(ADMIN_ROUTE_ALIASES.seoCreedaAI);
}
