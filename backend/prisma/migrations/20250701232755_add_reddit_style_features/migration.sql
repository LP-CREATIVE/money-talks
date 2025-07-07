-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('RETAIL', 'INSTITUTIONAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('QUEUED', 'TOP_100', 'ARCHIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ValidationType" AS ENUM ('AI_AUTOMATED', 'PEER_REVIEW', 'EXPERT_REVIEW');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('LIKE', 'DISLIKE', 'FLAG');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "organizationName" TEXT,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalIdea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detailedPlan" TEXT,
    "sector" TEXT,
    "marketCap" TEXT,
    "status" "IdeaStatus" NOT NULL DEFAULT 'QUEUED',
    "totalEscrow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "escrowRank" INTEGER,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "InstitutionalIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowContribution" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isRefundable" BOOLEAN NOT NULL DEFAULT true,
    "wasRefunded" BOOLEAN NOT NULL DEFAULT false,
    "refundDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,

    CONSTRAINT "EscrowContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationQuestion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isTop3" BOOLEAN NOT NULL DEFAULT false,
    "questionSlot" INTEGER,
    "bidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minAnswerScore" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "hasValidAnswer" BOOLEAN NOT NULL DEFAULT false,
    "refundTriggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ideaId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "escrowSourceId" TEXT,

    CONSTRAINT "ValidationQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" TEXT[],
    "aiValidationScore" DOUBLE PRECISION,
    "manualReviewScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "payoutEarned" DOUBLE PRECISION,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "flags" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerInteraction" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnswerInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "parentReplyId" TEXT,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaValidation" (
    "id" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ideaId" TEXT NOT NULL,

    CONSTRAINT "IdeaValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerValidation" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT,
    "validationType" "ValidationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answerId" TEXT NOT NULL,

    CONSTRAINT "AnswerValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundTransaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,

    CONSTRAINT "RefundTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarningTransaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,

    CONSTRAINT "EarningTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AnswerInteraction_answerId_idx" ON "AnswerInteraction"("answerId");

-- CreateIndex
CREATE INDEX "AnswerInteraction_userId_idx" ON "AnswerInteraction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerInteraction_answerId_userId_type_key" ON "AnswerInteraction"("answerId", "userId", "type");

-- CreateIndex
CREATE INDEX "Reply_answerId_idx" ON "Reply"("answerId");

-- CreateIndex
CREATE INDEX "Reply_parentReplyId_idx" ON "Reply"("parentReplyId");

-- CreateIndex
CREATE INDEX "Reply_userId_idx" ON "Reply"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundTransaction_escrowId_key" ON "RefundTransaction"("escrowId");

-- CreateIndex
CREATE UNIQUE INDEX "EarningTransaction_answerId_key" ON "EarningTransaction"("answerId");

-- AddForeignKey
ALTER TABLE "InstitutionalIdea" ADD CONSTRAINT "InstitutionalIdea_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowContribution" ADD CONSTRAINT "EscrowContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowContribution" ADD CONSTRAINT "EscrowContribution_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "InstitutionalIdea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationQuestion" ADD CONSTRAINT "ValidationQuestion_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "InstitutionalIdea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationQuestion" ADD CONSTRAINT "ValidationQuestion_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationQuestion" ADD CONSTRAINT "ValidationQuestion_escrowSourceId_fkey" FOREIGN KEY ("escrowSourceId") REFERENCES "EscrowContribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ValidationQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerInteraction" ADD CONSTRAINT "AnswerInteraction_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "UserAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerInteraction" ADD CONSTRAINT "AnswerInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "UserAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaValidation" ADD CONSTRAINT "IdeaValidation_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "InstitutionalIdea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerValidation" ADD CONSTRAINT "AnswerValidation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "UserAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTransaction" ADD CONSTRAINT "RefundTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundTransaction" ADD CONSTRAINT "RefundTransaction_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "EscrowContribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarningTransaction" ADD CONSTRAINT "EarningTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarningTransaction" ADD CONSTRAINT "EarningTransaction_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "UserAnswer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
