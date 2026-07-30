import crypto from "crypto";
import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Pretend webhook arrives
//         ↓
// reserveReviewRun() returns null
//         ↓
// Route recognizes a duplicate
//         ↓
// Returns HTTP 200
//         ↓
// No PR fetching, AI review, or GitHub posting

const mocks = vi.hoisted(() => {
  process.env.GITHUB_WEBHOOK_SECRET = "test-secret";

  return {
    getInstallationOctokit: vi.fn(),
    getPullRequestFiles: vi.fn(),
    reviewChunksWithAI: vi.fn(),
    reserveReviewRun: vi.fn(),
    saveReviewRun: vi.fn(),
    postPullRequestReview: vi.fn(),
  };
});

vi.mock("./github/auth.js", () => ({
  getInstallationOctokit: mocks.getInstallationOctokit,
}));

vi.mock("./github/pull.js", () => ({
  getPullRequestFiles: mocks.getPullRequestFiles,
}));

vi.mock("./review/aiReviewEngine.js", () => ({
  reviewChunksWithAI: mocks.reviewChunksWithAI,
}));

vi.mock("./review/saveReviewRun.js", () => ({
  reserveReviewRun: mocks.reserveReviewRun,
  saveReviewRun: mocks.saveReviewRun,
}));

vi.mock("./github/postReview.js", () => ({
  postPullRequestReview: mocks.postPullRequestReview,
}));

import { app } from "./app.js";

const payload = {
  action: "opened",
  installation: {
    id: 321,
  },
  repository: {
    full_name: "example/lintmind-test",
    name: "lintmind-test",
    owner: {
      login: "example",
    },
  },
  pull_request: {
    number: 12,
    title: "Test pull request",
    user: {
      login: "contributor",
    },
    head: {
      sha: "abc123",
    },
  },
};

function createSignature(body) {
  return (
    "sha256=" +
    crypto.createHmac("sha256", "test-secret").update(body).digest("hex")
  );
}

describe("POST /api/github/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.reserveReviewRun.mockResolvedValue(null);
    mocks.getInstallationOctokit.mockResolvedValue({});
    mocks.getPullRequestFiles.mockResolvedValue([]);
    mocks.reviewChunksWithAI.mockResolvedValue([]);

    mocks.saveReviewRun.mockResolvedValue({
      id: 1,
      status: "COMPLETED",
      commentCount: 0,
      comments: [],
    });

    mocks.postPullRequestReview.mockResolvedValue(null);
  });

  test("returns 200 without processing a duplicate delivery", async () => {
    const body = JSON.stringify(payload);

    const response = await request(app)
      .post("/api/github/webhook")
      .set("Content-Type", "application/json")
      .set("x-github-event", "pull_request")
      .set("x-github-delivery", "duplicate-delivery-123")
      .set("x-hub-signature-256", createSignature(body))
      .send(body);

    expect(response.status).toBe(200);
    expect(response.text).toBe("Duplicate delivery ignored");

    expect(mocks.getPullRequestFiles).not.toHaveBeenCalled();
    expect(mocks.reviewChunksWithAI).not.toHaveBeenCalled();
    expect(mocks.postPullRequestReview).not.toHaveBeenCalled();
  });
});
