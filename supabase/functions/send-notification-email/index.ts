import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to?: string;
  subject: string;
  type: "comment" | "like" | "article_published" | "subscriber_notification";
  articleTitle: string;
  articleUrl: string;
  userName?: string;
  commentContent?: string;
  sendToSubscribers?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, type, articleTitle, articleUrl, userName, commentContent, sendToSubscribers }: NotificationEmailRequest = await req.json();

    let emailHtml = "";

    if (type === "comment") {
      emailHtml = `
        <h2>New Comment on "${articleTitle}"</h2>
        <p><strong>${userName || "Someone"}</strong> commented on your article:</p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0;">
          ${commentContent}
        </blockquote>
        <p><a href="${articleUrl}" style="color: #2563eb; text-decoration: none;">View article and respond</a></p>
      `;
    } else if (type === "like") {
      emailHtml = `
        <h2>Your article received a like!</h2>
        <p><strong>${userName || "Someone"}</strong> liked your article:</p>
        <p style="font-size: 18px; font-weight: bold;">"${articleTitle}"</p>
        <p><a href="${articleUrl}" style="color: #2563eb; text-decoration: none;">View article</a></p>
      `;
    } else if (type === "article_published") {
      emailHtml = `
        <h2>Article Published Successfully</h2>
        <p>Your article <strong>"${articleTitle}"</strong> has been published!</p>
        <p><a href="${articleUrl}" style="color: #2563eb; text-decoration: none;">View your article</a></p>
      `;
    } else if (type === "subscriber_notification") {
      emailHtml = `
        <h2>New Article Published!</h2>
        <p>A new article has been published:</p>
        <p style="font-size: 18px; font-weight: bold;">"${articleTitle}"</p>
        <p><a href="${articleUrl}" style="color: #2563eb; text-decoration: none;">Read the article</a></p>
      `;
    }

    // If sending to subscribers, fetch all active subscribers
    if (sendToSubscribers) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: subscribers, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('email')
        .eq('is_active', true);

      if (subError) {
        console.error('Error fetching subscribers:', subError);
      } else if (subscribers && subscribers.length > 0) {
        const subscriberEmails = subscribers.map(s => s.email);
        
        for (const email of subscriberEmails) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "GlobalView News <onboarding@resend.dev>",
                to: [email],
                subject,
                html: emailHtml,
              }),
            });
          } catch (err) {
            console.error(`Failed to send to ${email}:`, err);
          }
        }
        
        return new Response(JSON.stringify({ success: true, sent: subscriberEmails.length }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GlobalView News <onboarding@resend.dev>",
        to: [to],
        subject,
        html: emailHtml,
      }),
    });

    const responseData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(responseData)}`);
    }

    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
