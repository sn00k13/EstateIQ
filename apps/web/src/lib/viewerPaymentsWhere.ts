import type { Prisma } from '@estateiq/database'

/**
 * Payments visible to a non-admin resident on the levies page: tied to their
 * resident record and/or their unit (invoice rows may use either, depending
 * on how the levy was generated).
 */
export function viewerPaymentsWhere(
  estateId: string,
  resident: { id: string; unitId: string | null }
): Prisma.PaymentWhereInput {
  return {
    levy: { estateId },
    OR: [
      { residentId: resident.id },
      ...(resident.unitId ? [{ unitId: resident.unitId }] : []),
    ],
  }
}
