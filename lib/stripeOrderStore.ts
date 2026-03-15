import { prisma } from "./prisma";
import { Order } from "./types";

export async function savePendingStripeOrder(sessionId: string, order: Order) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2h

  await prisma.stripePendingOrder.upsert({
    where: { stripeSessionId: sessionId },
    update: {
      orderCode: order.id,
      payloadJson: JSON.stringify(order),
      expiresAt,
    },
    create: {
      stripeSessionId: sessionId,
      orderCode: order.id,
      payloadJson: JSON.stringify(order),
      expiresAt,
    },
  });
}

export async function consumePendingStripeOrder(
  sessionId: string,
): Promise<Order | undefined> {
  const record = await prisma.stripePendingOrder.findUnique({
    where: { stripeSessionId: sessionId },
  });

  if (!record) return undefined;

  await prisma.stripePendingOrder.delete({
    where: { stripeSessionId: sessionId },
  });

  return JSON.parse(record.payloadJson) as Order;
}

