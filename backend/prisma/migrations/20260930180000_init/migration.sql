-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ASSESSOR', 'SANITIZATION_OFFICER', 'DISPOSITION_OFFICER', 'VIEWER');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('LAPTOP', 'DESKTOP', 'TABLET', 'OTHER');

-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('HDD', 'SSD', 'NVME', 'EMMC', 'NONE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('RECEIVED', 'UNDER_ASSESSMENT', 'ASSESSMENT_COMPLETE', 'AWAITING_SANITIZATION', 'SANITIZATION_IN_PROGRESS', 'SANITIZED', 'AWAITING_DISPOSITION', 'DISPOSITION_IN_PROGRESS', 'DISPOSED', 'REDEPLOYED', 'RECYCLED', 'SCRAPPED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ConditionGrade" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'MISSING', 'FAILED', 'NOT_TESTED');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('REDEPLOY', 'REPAIR', 'REASSIGN', 'SANITIZE_AND_REDEPLOY', 'DONATE', 'RESELL', 'RECYCLE', 'SCRAP', 'HOLD');

-- CreateEnum
CREATE TYPE "SanitizationMethod" AS ENUM ('NIST_800_88_CLEAR', 'NIST_800_88_PURGE', 'CRYPTO_ERASE', 'SECURE_ERASE', 'PHYSICAL_DESTRUCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "SanitizationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "DispositionType" AS ENUM ('REDEPLOYED', 'DONATED', 'SOLD', 'RECYCLED', 'SCRAPPED', 'RETURNED', 'DESTROYED');

-- CreateEnum
CREATE TYPE "DispositionStatus" AS ENUM ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('DEVICE_CREATED', 'DEVICE_UPDATED', 'DEVICE_SOFT_DELETED', 'ASSESSMENT_CREATED', 'ASSESSMENT_UPDATED', 'SANITIZATION_APPROVED', 'SANITIZATION_STARTED', 'SANITIZATION_COMPLETED', 'SANITIZATION_VERIFIED', 'DISPOSITION_CREATED', 'DISPOSITION_APPROVED', 'DISPOSITION_REJECTED', 'DISPOSITION_COMPLETED', 'USER_CREATED', 'USER_UPDATED', 'USER_DISABLED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'DOCUMENT_UPLOADED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('DEVICE', 'ASSESSMENT', 'SANITIZATION', 'DISPOSITION', 'USER', 'DOCUMENT', 'AUTH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "processor" TEXT,
    "ram" TEXT,
    "storage" TEXT,
    "storageType" "StorageType",
    "operatingSystem" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(12,2),
    "currentCondition" "ConditionGrade",
    "location" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "assignedUser" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'RECEIVED',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "physicalCondition" "ConditionGrade" NOT NULL,
    "screenCondition" "ConditionGrade" NOT NULL,
    "keyboardCondition" "ConditionGrade" NOT NULL,
    "batteryCondition" "ConditionGrade" NOT NULL,
    "chargerCondition" "ConditionGrade" NOT NULL,
    "portsCondition" "ConditionGrade" NOT NULL,
    "storageHealth" "ConditionGrade" NOT NULL,
    "memoryHealth" "ConditionGrade" NOT NULL,
    "displayHealth" "ConditionGrade" NOT NULL,
    "operatingSystemCondition" "ConditionGrade" NOT NULL,
    "functionalTest" BOOLEAN NOT NULL,
    "hardwareTest" BOOLEAN NOT NULL,
    "batteryTest" BOOLEAN NOT NULL,
    "networkTest" BOOLEAN NOT NULL,
    "estimatedRepairCost" DECIMAL(12,2),
    "estimatedMarketValue" DECIMAL(12,2),
    "assessmentNotes" TEXT NOT NULL,
    "recommendation" "Recommendation" NOT NULL,
    "sanitizationRequired" BOOLEAN NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SanitizationRecord" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "sanitizationDate" TIMESTAMP(3),
    "method" "SanitizationMethod" NOT NULL,
    "software" TEXT NOT NULL,
    "softwareVersion" TEXT NOT NULL,
    "driveType" TEXT NOT NULL,
    "driveIdentifier" TEXT NOT NULL,
    "verificationMethod" TEXT,
    "verificationResult" "VerificationResult" NOT NULL DEFAULT 'PENDING',
    "status" "SanitizationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "notes" TEXT,
    "certificateNumber" TEXT,
    "certificateFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SanitizationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disposition" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "dispositionType" "DispositionType" NOT NULL,
    "status" "DispositionStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "completedById" TEXT,
    "recipientName" TEXT,
    "recipientOrganization" TEXT,
    "recipientContact" TEXT,
    "salePrice" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'KES',
    "dispositionDate" TIMESTAMP(3),
    "referenceNumber" TEXT,
    "notes" TEXT,
    "supportingDocument" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_assetTag_key" ON "Device"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE INDEX "Device_department_idx" ON "Device"("department");

-- CreateIndex
CREATE INDEX "Device_location_idx" ON "Device"("location");

-- CreateIndex
CREATE INDEX "Device_manufacturer_idx" ON "Device"("manufacturer");

-- CreateIndex
CREATE INDEX "Device_deletedAt_idx" ON "Device"("deletedAt");

-- CreateIndex
CREATE INDEX "Assessment_deviceId_idx" ON "Assessment"("deviceId");

-- CreateIndex
CREATE INDEX "Assessment_assessorId_idx" ON "Assessment"("assessorId");

-- CreateIndex
CREATE UNIQUE INDEX "SanitizationRecord_certificateNumber_key" ON "SanitizationRecord"("certificateNumber");

-- CreateIndex
CREATE INDEX "SanitizationRecord_deviceId_idx" ON "SanitizationRecord"("deviceId");

-- CreateIndex
CREATE INDEX "SanitizationRecord_status_idx" ON "SanitizationRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Disposition_referenceNumber_key" ON "Disposition"("referenceNumber");

-- CreateIndex
CREATE INDEX "Disposition_deviceId_idx" ON "Disposition"("deviceId");

-- CreateIndex
CREATE INDEX "Disposition_status_idx" ON "Disposition"("status");

-- CreateIndex
CREATE INDEX "Document_entityType_entityId_idx" ON "Document"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanitizationRecord" ADD CONSTRAINT "SanitizationRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanitizationRecord" ADD CONSTRAINT "SanitizationRecord_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SanitizationRecord" ADD CONSTRAINT "SanitizationRecord_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposition" ADD CONSTRAINT "Disposition_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposition" ADD CONSTRAINT "Disposition_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposition" ADD CONSTRAINT "Disposition_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

