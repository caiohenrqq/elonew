-- Convert monetary columns from floating-point reais to integer minor units (cents).
-- Existing values are scaled with ROUND(value * 100) so 35.00 reais becomes 3500 cents.
-- Non-money columns (profiles.reputation, pricing_extras.modifierRate, coupons.discount)
-- intentionally remain DoublePrecision; coupons.discount carries dual percentage/fixed semantics.

-- orders
ALTER TABLE "orders"
  ALTER COLUMN "subtotal" SET DATA TYPE INTEGER USING ROUND("subtotal" * 100)::integer,
  ALTER COLUMN "totalAmount" SET DATA TYPE INTEGER USING ROUND("totalAmount" * 100)::integer,
  ALTER COLUMN "discountAmount" DROP DEFAULT,
  ALTER COLUMN "discountAmount" SET DATA TYPE INTEGER USING ROUND("discountAmount" * 100)::integer,
  ALTER COLUMN "discountAmount" SET DEFAULT 0;

-- order_quotes
ALTER TABLE "order_quotes"
  ALTER COLUMN "subtotal" SET DATA TYPE INTEGER USING ROUND("subtotal" * 100)::integer,
  ALTER COLUMN "totalAmount" SET DATA TYPE INTEGER USING ROUND("totalAmount" * 100)::integer,
  ALTER COLUMN "discountAmount" DROP DEFAULT,
  ALTER COLUMN "discountAmount" SET DATA TYPE INTEGER USING ROUND("discountAmount" * 100)::integer,
  ALTER COLUMN "discountAmount" SET DEFAULT 0;

-- order_extras
ALTER TABLE "order_extras"
  ALTER COLUMN "price" SET DATA TYPE INTEGER USING ROUND("price" * 100)::integer;

-- order_quote_extras
ALTER TABLE "order_quote_extras"
  ALTER COLUMN "price" SET DATA TYPE INTEGER USING ROUND("price" * 100)::integer;

-- payments
ALTER TABLE "payments"
  ALTER COLUMN "grossAmount" SET DATA TYPE INTEGER USING ROUND("grossAmount" * 100)::integer,
  ALTER COLUMN "boosterAmount" SET DATA TYPE INTEGER USING ROUND("boosterAmount" * 100)::integer;

-- wallets
ALTER TABLE "wallets"
  ALTER COLUMN "balanceLocked" DROP DEFAULT,
  ALTER COLUMN "balanceLocked" SET DATA TYPE INTEGER USING ROUND("balanceLocked" * 100)::integer,
  ALTER COLUMN "balanceLocked" SET DEFAULT 0,
  ALTER COLUMN "balanceWithdrawable" DROP DEFAULT,
  ALTER COLUMN "balanceWithdrawable" SET DATA TYPE INTEGER USING ROUND("balanceWithdrawable" * 100)::integer,
  ALTER COLUMN "balanceWithdrawable" SET DEFAULT 0;

-- wallet_transactions
ALTER TABLE "wallet_transactions"
  ALTER COLUMN "amount" SET DATA TYPE INTEGER USING ROUND("amount" * 100)::integer;

-- pricing_steps
ALTER TABLE "pricing_steps"
  ALTER COLUMN "priceToNext" SET DATA TYPE INTEGER USING ROUND("priceToNext" * 100)::integer;
