import { renderEmailLayout } from "./layout";

export function subscriptionConfirmationEmail(params: { name?: string }): { subject: string; html: string } {
  const greeting = params.name ? `Hi ${params.name},` : "Hi there,";
  const subject = "You're subscribed to ARAMWAY GROUP";

  const html = renderEmailLayout({
    preheader: "You're now subscribed to ARAMWAY GROUP's newsletter — market insights, expansion strategies, and program updates.",
    heading: "You're subscribed to ARAMWAY GROUP! 🎉",
    bodyHtml: `
      <p style="margin: 0 0 16px;">${greeting}</p>
      <p style="margin: 0 0 16px;">
        Thank you for subscribing to ARAMWAY GROUP. You'll now receive market insights, expansion
        strategies, and program updates straight to your inbox — including a note whenever we
        publish a new blog post.
      </p>
      <p style="margin: 0;">
        In the meantime, feel free to explore our latest thinking on cross-border expansion and
        market entry.
      </p>
    `,
    ctaLabel: "Read Our Blog",
    ctaUrl: `${process.env.FRONTEND_URL || "https://aramway.com"}/blogs`,
  });

  return { subject, html };
}
