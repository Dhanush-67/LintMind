import { prisma } from "../db/prisma.js";

export async function reserveReviewRun(reviewData) {
  try {
    return await prisma.reviewRun.create({
      data: {
        ...reviewData,
        status: "PROCESSING",
      },
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return null;
    }

    throw error;
  }
}

export async function saveReviewRun({
  repositoryFullName,
  pullRequestNumber,
  pullRequestTitle,
  pullRequestAuthor,
  installationId,
  githubDeliveryId,
  comments,
}) {
  return prisma.reviewRun.create({
    data: {
      repositoryFullName,
      pullRequestNumber,
      pullRequestTitle,
      pullRequestAuthor,
      installationId,
      githubDeliveryId,
      commentCount: comments.length,
      comments: {
        create: comments.map((comment) => ({
          filename: comment.filename,
          line: comment.line,
          comment: comment.body,
        })),
      },
    },
    include: {
      comments: true,
    },
  });
}

export async function completeReviewRun(reviewRunId, comments) {
  return prisma.reviewRun.update({
    where: {
      id: reviewRunId,
    },
    data: {
      status: "COMPLETED",
      commentCount: comments.length,
      comments: {
        create: comments.map((comment) => ({
          filename: comment.filename,
          line: comment.line,
          comment: comment.body,
        })),
      },
    },
    include: {
      comments: true,
    },
  });
}

export async function failReviewRun(reviewRunId) {
  return prisma.reviewRun.update({
    where: {
      id: reviewRunId,
    },
    data: {
      status: "FAILED",
    },
  });
}
