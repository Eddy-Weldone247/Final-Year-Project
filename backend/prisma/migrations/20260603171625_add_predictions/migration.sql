-- CreateEnum
CREATE TYPE "PredictionKind" AS ENUM ('SPENDING', 'CATEGORY', 'MODEL');

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "PredictionKind" NOT NULL,
    "horizonDays" INTEGER,
    "result" JSONB NOT NULL,
    "mae" DOUBLE PRECISION,
    "rmse" DOUBLE PRECISION,
    "r2" DOUBLE PRECISION,
    "method" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "predictions_userId_kind_createdAt_idx" ON "predictions"("userId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
