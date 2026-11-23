import { EMAIL_LOGO_URL } from "@/lib/brand/email-logo";

/**
 * The customer-satisfaction survey email body.
 *
 * This template was duplicated verbatim in the Emails and Customers admin
 * screens, so a logo fix had to be made twice and the two could silently
 * diverge. It lives here now; both screens import it.
 *
 * Placeholders, substituted by the mail sender:
 *   `{{CUSTOMER_NAME}}` — the recipient's name
 *   `{{SURVEY_LINK}}`    — the tokenised survey URL
 *
 * The logo is an absolute URL on purpose: a relative `src` resolves against
 * the mail client, not the site. See `lib/brand/email-logo.ts` for why the
 * image is served from a route instead of `public/`.
 */
export const SURVEY_EMAIL_BODY = `<div style="max-width:600px;margin:0 auto;font-family:'Roboto',Arial,sans-serif;color:#0B2135;">
  <div style="text-align:center;padding:24px 0;">
    <img src="${EMAIL_LOGO_URL}" alt="CreedaVA" width="120" style="margin-bottom:12px;height: auto;" />
  </div>
  <div style="background:#F7F7F2;border-radius:12px;padding:32px;border:1px solid #e8edf5;">
    <h2 style="margin:0 0 8px;color:#005148;font-size:22px;">How are we doing?</h2>
    <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.6;">
      Hi {{CUSTOMER_NAME}},<br/><br/>
      Your feedback helps us improve the services we provide. Please take a moment to rate your experience — it only takes 30 seconds.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="{{SURVEY_LINK}}" style="display:inline-block;background:#005148;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;">
        Share Your Feedback →
      </a>
    </div>
    <p style="margin:20px 0 0;color:#888;font-size:13px;text-align:center;">
      This link is unique to you and will expire in 30 days.
    </p>
  </div>
  <div style="text-align:center;padding:24px 0;color:#888;font-size:12px;">
    <p>CreedaVA — Virtual Assistant Services</p>
    <p><a href="https://creedava.com" style="color:#005148;">creedava.com</a></p>
  </div>
</div>`;

/**
 * Markers that identify a stored draft still carrying the old logo.
 *
 * Matched against existing drafts so the correct template is re-seeded without
 * touching bodies an admin has rewritten for their own reasons. `logo.webp`
 * does not exist in any form that is servable from App Hosting.
 */
export const STALE_SURVEY_LOGO_MARKERS = [
  "logo.webp",
  'src="/logo',
  'alt="CreedaVA" width="20"',
] as const;
