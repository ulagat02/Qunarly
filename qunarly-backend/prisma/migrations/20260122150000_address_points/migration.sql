CREATE TABLE "AddressPoint" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "street" TEXT,
  "houseNumber" TEXT,
  "locality" TEXT,
  "source" TEXT NOT NULL DEFAULT 'user_contributed',
  "confirmCount" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AddressPoint_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AddressPoint"
ADD CONSTRAINT "AddressPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
