import { sendContactEmail } from "@/lib/email";
import { contactFormSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

