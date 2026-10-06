-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('render', 'cad');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('in_progress', 'approved', 'delivered');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('render_input', 'render_output', 'cad_source', 'cad_output');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'processing', 'qc', 'ready', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "RenderJobKind" AS ENUM ('generate', 'correction', 'restore');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenderJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "kind" "RenderJobKind" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "input" JSONB NOT NULL,
    "sourceVersionId" TEXT,
    "catalogVersion" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "imageProvider" TEXT,
    "imageModel" TEXT,
    "visionProvider" TEXT,
    "visionModel" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "RenderJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenderVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "kind" "RenderJobKind" NOT NULL,
    "assetId" TEXT NOT NULL,
    "parentVersionId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenderVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCallLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "durationMs" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCostEur" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditPrompt" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "pass" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "usedFragments" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "catalogVersion" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityReport" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_ownerId_updatedAt_idx" ON "Project"("ownerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_storageKey_key" ON "Asset"("storageKey");

-- CreateIndex
CREATE INDEX "Asset_projectId_idx" ON "Asset"("projectId");

-- CreateIndex
CREATE INDEX "RenderJob_projectId_createdAt_idx" ON "RenderJob"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RenderVersion_jobId_key" ON "RenderVersion"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "RenderVersion_projectId_number_key" ON "RenderVersion"("projectId", "number");

-- CreateIndex
CREATE INDEX "AiCallLog_userId_createdAt_idx" ON "AiCallLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditPrompt_jobId_idx" ON "AuditPrompt"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityReport_jobId_key" ON "QualityReport"("jobId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenderJob" ADD CONSTRAINT "RenderJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenderVersion" ADD CONSTRAINT "RenderVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenderVersion" ADD CONSTRAINT "RenderVersion_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RenderJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenderVersion" ADD CONSTRAINT "RenderVersion_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCallLog" ADD CONSTRAINT "AiCallLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RenderJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditPrompt" ADD CONSTRAINT "AuditPrompt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RenderJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityReport" ADD CONSTRAINT "QualityReport_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RenderJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
