import { describe, expect, test, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({
  prisma: {
    reviewRun: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "../db/prisma.js";
import * as reviewRunStore from "./saveReviewRun.js";

describe("reserveReviewRun", () => {
  test("creates a review run with PROCESSING status", async () => {
    const reviewData = {
      repositoryFullName: "owner/repository",
      pullRequestNumber: 12,
      pullRequestTitle: "Fix authentication bug",
      pullRequestAuthor: "octocat",
      installationId: 12345,
      githubDeliveryId: "delivery-abc",
    };

    prisma.reviewRun.create.mockResolvedValue({
      id: 1,
      ...reviewData,
      status: "PROCESSING",
    });

    expect(reviewRunStore.reserveReviewRun).toBeTypeOf("function");

    await reviewRunStore.reserveReviewRun(reviewData);

    expect(prisma.reviewRun.create).toHaveBeenCalledWith({
      data: {
        ...reviewData,
        status: "PROCESSING",
      },
    });
  });

  test("returns null when the delivery ID has already been reserved", async () => {
    const reviewData = {
      repositoryFullName: "owner/repository",
      pullRequestNumber: 12,
      pullRequestTitle: "Fix authentication bug",
      pullRequestAuthor: "octocat",
      installationId: 12345,
      githubDeliveryId: "duplicate-delivery",
    };

    const duplicateError = {
      code: "P2002",
    };

    prisma.reviewRun.create.mockRejectedValue(duplicateError);

    await expect(
      reviewRunStore.reserveReviewRun(reviewData),
    ).resolves.toBeNull();
  });
});

describe("CompletedReviewRun", () => {
  test("marks the reserved run as completed and saves its comments", async () => {
    const comments = [
      {
        filename: "src/example.js",
        line: 10,
        body: "Avoid logging sensitive information.",
      },
    ];

    prisma.reviewRun.update.mockResolvedValue({
      id: 1,
      status: "COMPLETED",
      commentCount: 1,
      comments: comments,
    });

    expect(reviewRunStore.completeReviewRun).toBeTypeOf("function");

    await reviewRunStore.completeReviewRun(1, comments);

    expect(prisma.reviewRun.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: {
        status: "COMPLETED",
        commentCount: 1,
        comments: {
          create: [
            {
              filename: "src/example.js",
              line: 10,
              comment: "Avoid logging sensitive information.",
            },
          ],
        },
      },
      include: {
        comments: true,
      },
    });

    const result = await reviewRunStore.completeReviewRun(1, comments);

    expect(result.comments).toEqual(comments);
  });
});

describe("failReviewRun", () => {
  test("marks the reserved run as FAILED", async () => {
    prisma.reviewRun.update.mockResolvedValue({
      id: 1,
      status: "FAILED",
    });

    expect(reviewRunStore.failReviewRun).toBeTypeOf("function");

    await reviewRunStore.failReviewRun(1);

    expect(prisma.reviewRun.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: {
        status: "FAILED",
      },
    });
  });
});
