import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { scriptId, recipientEmail, senderName, message, shareType } = await req.json();

    if (!scriptId || !recipientEmail || !senderName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get script details
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: script, error: scriptError } = await supabase
      .from("sw_scripts")
      .select("title")
      .eq("id", scriptId)
      .single();

    if (scriptError || !script) {
      return new Response(JSON.stringify({ error: "Script not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const shareUrl = `https://nexwriter.vercel.app/shared/${scriptId}`;
    const shareLabel = shareType === "edit" ? "edit" : "view";

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NexWriter <noreply@nexusmobiletech.com>",
        to: [recipientEmail],
        subject: `${senderName} shared "${script.title}" with you`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F2F0EB;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F0EB;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#B5751A;padding:24px 32px;">
              <span style="color:#FFFFFF;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Nex<span style="opacity:0.9;">Writer</span>
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1A1714;">
                Script shared with you
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#5C5650;line-height:1.6;">
                <strong>${senderName}</strong> has invited you to ${shareLabel}
                <strong>"${script.title}"</strong>
              </p>
              ${message ? `
              <div style="margin:0 0 24px;padding:16px;background-color:#FFF5E0;border-radius:10px;border-left:3px solid #B5751A;">
                <p style="margin:0;font-size:14px;color:#5C5650;line-height:1.5;font-style:italic;">
                  "${message}"
                </p>
              </div>
              ` : ""}
              <a href="${shareUrl}" style="display:inline-block;padding:12px 28px;background-color:#B5751A;color:#FFFFFF;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;">
                Open Script
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #D8D4CB;">
              <p style="margin:0;font-size:12px;color:#8A847C;line-height:1.5;">
                Sent via <a href="https://nexwriter.vercel.app" style="color:#B5751A;text-decoration:none;">NexWriter</a> by Nexus Mobile Tech
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend error:", errorData);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Share email error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
