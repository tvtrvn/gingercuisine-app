import { TAX_RATE } from "@/lib/config";
import { sendOrderEmail } from "@/lib/email";
import { addOrder } from "@/lib/orderStore";
import { Order } from "@/lib/types";
import { orderRequestSchema } from "@/lib/validation";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = orderRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { items, pickupDetails, paymentMethod } = parsed.data;
    const subtotal = items.reduce(
      (sum, item) => sum + (item.unitPrice ?? item.price) * item.quantity,
      0,
    );
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const orderId = `GC-${Date.now().toString(36).toUpperCase()}`;
    const order: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      items,
      pickupDetails,
      paymentMethod,
      status: "new",
      totals: {
        subtotal,
        tax,
        total,
      },
    };

    await addOrder(order);
    await sendOrderEmail(order);

    return NextResponse.json(
      {
        orderId,
        totals: order.totals,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong while creating the order." },
      { status: 500 },
    );
  }
}

