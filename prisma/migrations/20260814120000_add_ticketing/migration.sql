-- CreateEnum
CREATE TYPE "TicketPaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TicketPaymentMethod" AS ENUM ('MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY', 'CASH_POS', 'CARD');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'EXECUTED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'ORGANIZER';
ALTER TYPE "UserRole" ADD VALUE 'AGENT';
ALTER TYPE "UserRole" ADD VALUE 'POS_VENDOR';

-- CreateTable
CREATE TABLE "TicketingConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "platformCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "posCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    "minPayoutAmount" DECIMAL(14,2) NOT NULL DEFAULT 50000,
    "reservationTtlMinutes" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMga" DECIMAL(14,2) NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "remainingQuantity" INTEGER NOT NULL,
    "maxPerOrder" INTEGER NOT NULL DEFAULT 10,
    "salesEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketOrder" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "platformFee" DECIMAL(14,2) NOT NULL,
    "posFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "organizerNet" DECIMAL(14,2) NOT NULL,
    "paymentStatus" "TicketPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "TicketPaymentMethod" NOT NULL,
    "transactionRef" TEXT,
    "channelSource" TEXT NOT NULL DEFAULT 'WEB',
    "posVendorId" TEXT,
    "notifyLog" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTicket" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "ownerId" TEXT,
    "securityCode" VARCHAR(6) NOT NULL,
    "qrHash" TEXT NOT NULL,
    "isScanned" BOOLEAN NOT NULL DEFAULT false,
    "scannedAt" TIMESTAMP(3),
    "scannedById" TEXT,
    "isForResale" BOOLEAN NOT NULL DEFAULT false,
    "resalePrice" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosWallet" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "cashBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCommissionsEarned" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "depositCap" DECIMAL(14,2) NOT NULL DEFAULT 5000000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "mobileMoneyNumber" TEXT NOT NULL,
    "provider" "TicketPaymentMethod" NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketType_eventId_idx" ON "TicketType"("eventId");

-- CreateIndex
CREATE INDEX "TicketType_isActive_idx" ON "TicketType"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TicketOrder_idempotencyKey_key" ON "TicketOrder"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "TicketOrder_transactionRef_key" ON "TicketOrder"("transactionRef");

-- CreateIndex
CREATE INDEX "TicketOrder_clientPhone_idx" ON "TicketOrder"("clientPhone");

-- CreateIndex
CREATE INDEX "TicketOrder_paymentStatus_idx" ON "TicketOrder"("paymentStatus");

-- CreateIndex
CREATE INDEX "TicketOrder_eventId_idx" ON "TicketOrder"("eventId");

-- CreateIndex
CREATE INDEX "TicketOrder_expiresAt_idx" ON "TicketOrder"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventTicket_qrHash_key" ON "EventTicket"("qrHash");

-- CreateIndex
CREATE INDEX "EventTicket_orderId_idx" ON "EventTicket"("orderId");

-- CreateIndex
CREATE INDEX "EventTicket_ticketTypeId_idx" ON "EventTicket"("ticketTypeId");

-- CreateIndex
CREATE INDEX "EventTicket_ownerId_idx" ON "EventTicket"("ownerId");

-- CreateIndex
CREATE INDEX "EventTicket_securityCode_idx" ON "EventTicket"("securityCode");

-- CreateIndex
CREATE UNIQUE INDEX "PosWallet_vendorId_key" ON "PosWallet"("vendorId");

-- CreateIndex
CREATE INDEX "PayoutRequest_organizerId_idx" ON "PayoutRequest"("organizerId");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- AddForeignKey
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketOrder" ADD CONSTRAINT "TicketOrder_posVendorId_fkey" FOREIGN KEY ("posVendorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TicketOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTicket" ADD CONSTRAINT "EventTicket_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosWallet" ADD CONSTRAINT "PosWallet_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- CONTRAINTE LIGNE UNIQUE + CONFIG PAR DÉFAUT
-- ============================================================================

-- La table de configuration ne doit jamais contenir qu'une seule ligne (id = 1).
ALTER TABLE "TicketingConfig"
  ADD CONSTRAINT "TicketingConfig_single_row" CHECK ("id" = 1);

-- Insère la ligne de configuration par défaut si elle n'existe pas encore.
INSERT INTO "TicketingConfig" ("id", "updatedAt")
VALUES (1, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Garde-fous supplémentaires : quantités et montants non négatifs.
ALTER TABLE "TicketType"
  ADD CONSTRAINT "TicketType_remaining_nonneg" CHECK ("remainingQuantity" >= 0),
  ADD CONSTRAINT "TicketType_total_nonneg" CHECK ("totalQuantity" >= 0),
  ADD CONSTRAINT "TicketType_remaining_lte_total" CHECK ("remainingQuantity" <= "totalQuantity");

-- ============================================================================
-- RÉSERVATION ATOMIQUE DES STOCKS (Pessimistic Locking)
-- ============================================================================
-- Empêche la survente lors des pics de trafic. Le SELECT ... FOR UPDATE
-- verrouille la ligne du type de billet le temps de la transaction, de sorte
-- que deux acheteurs concurrents ne puissent pas décrémenter le même stock.
-- Vérifie aussi que la vente est encore active et non clôturée.
CREATE OR REPLACE FUNCTION reserve_tickets(p_ticket_type_id TEXT, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_available   INT;
  v_is_active   BOOLEAN;
  v_sales_end   TIMESTAMP(3);
  v_max_order   INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;

  SELECT "remainingQuantity", "isActive", "salesEnd", "maxPerOrder"
    INTO v_available, v_is_active, v_sales_end, v_max_order
    FROM "TicketType"
   WHERE "id" = p_ticket_type_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_is_active IS NOT TRUE THEN
    RETURN FALSE;
  END IF;

  IF v_sales_end IS NOT NULL AND v_sales_end <= NOW() THEN
    RETURN FALSE;
  END IF;

  IF p_qty > v_max_order THEN
    RETURN FALSE;
  END IF;

  IF v_available >= p_qty THEN
    UPDATE "TicketType"
       SET "remainingQuantity" = "remainingQuantity" - p_qty,
           "updatedAt" = NOW()
     WHERE "id" = p_ticket_type_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- LIBÉRATION DES STOCKS (annulation / expiration / échec de paiement)
-- ============================================================================
-- Rend les places au stock sans jamais dépasser le total configuré.
CREATE OR REPLACE FUNCTION release_tickets(p_ticket_type_id TEXT, p_qty INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_total     INT;
  v_remaining INT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RETURN FALSE;
  END IF;

  SELECT "totalQuantity", "remainingQuantity"
    INTO v_total, v_remaining
    FROM "TicketType"
   WHERE "id" = p_ticket_type_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE "TicketType"
     SET "remainingQuantity" = LEAST(v_total, v_remaining + p_qty),
         "updatedAt" = NOW()
   WHERE "id" = p_ticket_type_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
