import { redirect } from "next/navigation";
import { ADMIN_ROUTE_ALIASES } from "@/lib/utils/admin-route-aliases";

// AI Activity / the former AI Dashboard. Creeda AI now has a single entry point:
// the chat button on the admin dashboard.
export default function AIActivityRedirect() {
  redirect(ADMIN_ROUTE_ALIASES.creedAI);
}
