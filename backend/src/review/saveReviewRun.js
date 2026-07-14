import { prisma } from "../db/prisma.js";

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
