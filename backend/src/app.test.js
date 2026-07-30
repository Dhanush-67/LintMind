import crypto from "crypto";
import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mock = vi.hoisted(() => {
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
