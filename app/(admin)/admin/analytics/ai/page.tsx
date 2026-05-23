import { redirect } from "next/navigation";
import { ADMIN_ROUTE_ALIASES } from "@/lib/utils/admin-route-aliases";

// AI Activity has been merged into the AI Dashboard
export default function AIActivityRedirect() {
  redirect(ADMIN_ROUTE_ALIASES.analyticsReports);
}
