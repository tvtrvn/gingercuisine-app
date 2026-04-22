import { sendContactEmail } from "@/lib/email";
import {
  contactRateLimit,
  getClientIp,
  retryAfterSeconds,
} from "@/lib/rateLimit";
import { isSameOrigin } from "@/lib/requireSameOrigin";
import { contactFormSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await contactRateLimit.limit(`ip:${getClientIp(req)}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds(rl.reset)),
        },
      },
    );
  }

  try {
    const json = await req.json();
    const parsed = contactFormSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await sendContactEmail(parsed.data);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while sending the message." },
      { status: 500 },
    );
  }
}
