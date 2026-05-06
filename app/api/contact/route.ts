import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTACT_TO = "qtntfnns@gmail.com";
const DEFAULT_FROM = "REVORA <onboarding@resend.dev>";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  linkedin?: unknown;
  message?: unknown;
  website?: unknown;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function makeMailtoHref(
  name: string,
  email: string,
  company: string,
  linkedin: string,
  message: string
) {
  const subject = encodeURIComponent(`Contact REVORA - ${name || email}`);
  const body = encodeURIComponent(
    [
      `Nom: ${name}`,
      `Email: ${email}`,
      company ? `Entreprise: ${company}` : "",
      linkedin ? `LinkedIn: ${linkedin}` : "",
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return `mailto:${CONTACT_TO}?subject=${subject}&body=${body}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactPayload;
    const name = clean(body.name);
    const email = clean(body.email);
    const company = clean(body.company);
    const linkedin = clean(body.linkedin);
    const message = clean(body.message);
    const website = clean(body.website);

    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nom, email et message sont requis." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "Le message doit contenir au moins 10 caracteres." },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Le message est trop long." },
        { status: 400 }
      );
    }

    const mailtoHref = makeMailtoHref(name, email, company, linkedin, message);

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        ok: true,
        fallback: "mailto",
        mailtoHref,
      });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
        to: [CONTACT_TO],
        reply_to: email,
        subject: `Nouveau message REVORA - ${name}`,
        text: [
          `Nom: ${name}`,
          `Email: ${email}`,
          company ? `Entreprise: ${company}` : "",
          linkedin ? `LinkedIn: ${linkedin}` : "",
          "",
          message,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("contact email error:", errorText);

      return NextResponse.json(
        {
          ok: true,
          fallback: "mailto",
          mailtoHref,
        },
        { status: 202 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("contact error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer le message.",
      },
      { status: 500 }
    );
  }
}
