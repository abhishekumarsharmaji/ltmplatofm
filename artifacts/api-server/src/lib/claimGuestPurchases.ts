import { and, eq } from "drizzle-orm";
import {
  db,
  digitalProductEntitlementsTable,
  guestDigitalEntitlementsTable,
} from "@workspace/db";

function mergedExpiry(accountExpiry: Date | null, guestExpiry: Date | null) {
  if (!accountExpiry || !guestExpiry) return null;
  return accountExpiry.getTime() >= guestExpiry.getTime() ? accountExpiry : guestExpiry;
}

export async function claimGuestPurchasesByEmail(userId: number, rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return 0;

  return db.transaction(async (tx) => {
    const guestEntitlements = await tx.select().from(guestDigitalEntitlementsTable)
      .where(eq(guestDigitalEntitlementsTable.email, email));
    let claimed = 0;

    for (const guest of guestEntitlements) {
      await tx.insert(digitalProductEntitlementsTable).values({
        userId,
        productId: guest.productId,
        acquiredAt: guest.acquiredAt,
        expiresAt: guest.expiresAt,
      }).onConflictDoNothing();

      const [account] = await tx.select().from(digitalProductEntitlementsTable).where(and(
        eq(digitalProductEntitlementsTable.userId, userId),
        eq(digitalProductEntitlementsTable.productId, guest.productId),
      ));
      if (!account) throw new Error("Digital product entitlement could not be linked");

      const expiresAt = mergedExpiry(account.expiresAt, guest.expiresAt);
      const acquiredAt = account.acquiredAt.getTime() <= guest.acquiredAt.getTime()
        ? account.acquiredAt
        : guest.acquiredAt;
      if (
        account.expiresAt?.getTime() !== expiresAt?.getTime()
        || account.acquiredAt.getTime() !== acquiredAt.getTime()
      ) {
        await tx.update(digitalProductEntitlementsTable).set({ expiresAt, acquiredAt }).where(
          eq(digitalProductEntitlementsTable.id, account.id),
        );
      }
      claimed += 1;
    }

    return claimed;
  });
}