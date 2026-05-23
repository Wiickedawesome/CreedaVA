import { redirect } from "next/navigation";
import { ADMIN_ROUTE_ALIASES } from "@/lib/utils/admin-route-aliases";

export default function SeoTasksRedirect() {
  redirect(ADMIN_ROUTE_ALIASES.seoTasks);
}
