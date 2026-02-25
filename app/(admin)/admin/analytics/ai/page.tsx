import { redirect } from "next/navigation";

// AI Activity has been merged into the AI Dashboard
export default function AIActivityRedirect() {
  redirect("/admin/analytics/reports");
}
