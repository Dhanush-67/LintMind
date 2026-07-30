import { describe, expect, test, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({
  prisma: {
    reviewRun: {
      create: vi.fn(),
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
});
