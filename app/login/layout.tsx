import { ForceTheme } from "@/components/layout/force-theme";

export const dynamic = "force-dynamic";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The sign-in page is styled with the marketing tokens (mk-paper / mk-white /
  // mk-ink), not the admin set. Pinning it light means arriving here from a
  // dark-mode dashboard — including via the client-side redirect in
  // app/(admin)/admin/layout.tsx, which does not reload the document — can
  // never leave `data-theme="dark"` behind on a cream page.
  return (
    <>
      <ForceTheme theme="light" />
      {children}
    </>
  );
}
