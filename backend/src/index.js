import "dotenv/config";
import express from "express";
import crypto from "crypto";
import { getInstallationOctokit } from "./github/auth.js";
import { parsePatch } from "./github/diffParser.js";
import { getPullRequestFiles } from "./github/pull.js";
import { reviewChunks } from "./review/reviewEngine.js";
import { saveReviewRun } from "./review/saveReviewRun.js";
import { postPullRequestReview } from "./github/postReview.js";

const app = express();

const port = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error("Missing GITHUB_WEBHOOK_SECRET");
}

app.get("/", (req, res) => {
  res.send("LintMind backend is running");
});

app.post(
  "/api/github/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-hub-signature-256"];
      const event = req.headers["x-github-event"];
      const delivery = req.headers["x-github-delivery"];

      // console.log("Event:", event);
      // console.log("Delivery:", delivery);
      // console.log("Signature:", signature);

      const body = req.body;

      const expectedSignature =
        "sha256=" +
        crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");

      if (!signature) {
        console.log("Missing webhook signature");
        return res.status(401).send("Missing signature");
      }

      const isValid =
        Buffer.byteLength(signature) === Buffer.byteLength(expectedSignature) &&
        crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature),
        );

      if (!isValid) {
        console.log("Invalid webhook signature");
        return res.status(401).send("Invalid signature");
      }

      const payload = JSON.parse(body.toString("utf8"));

      console.log("Webhook verified");
      // console.log("Action:", payload.action);
      // console.log("Repo:", payload.repository?.full_name);
      // console.log("PR number:", payload.pull_request?.number);

      if (event !== "pull_request") {
        console.log(`Ignored event: ${event}`);
        return res.status(200).send("Ignored event");
      }

      const installationId = payload.installation?.id;

      if (!installationId) {
        console.log("No installation ID found");
        return res.status(200).send("No installation ID");
      }

      const octokit = await getInstallationOctokit(installationId);

      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const pullNumber = payload.pull_request.number;
      const commitId = payload.pull_request.head.sha;

      const action = payload.action;

      if (!["opened", "synchronize", "reopened"].includes(action)) {
        console.log(`Ignored pull_request action: ${action}`);
        return res.status(200).send("Ignored pull_request action");
      }

      const files = await getPullRequestFiles(octokit, owner, repo, pullNumber);

      console.log(
        "Changed files:",
        files.map((file) => file.filename),
      );

      const chunks = files.flatMap((file) => {
        return parsePatch(file.filename, file.patch);
      });

      console.log("Review chunks:");
      console.dir(chunks, { depth: null });

      const comments = reviewChunks(chunks);

      console.log("Generated comments:");
      console.dir(comments, { depth: null });

      const reviewRun = await saveReviewRun({
        repositoryFullName: payload.repository.full_name,
        pullRequestNumber: payload.pull_request.number,
        pullRequestTitle: payload.pull_request.title,
        pullRequestAuthor: payload.pull_request.user.login,
        installationId: payload.installation.id,
        githubDeliveryId: req.headers["x-github-delivery"],
        comments,
      });

      console.log(
        `Saved review run ${reviewRun.id} with ${reviewRun.commentCount} comments`,
      );

      const githubReview = await postPullRequestReview(
        octokit,
        owner,
        repo,
        pullNumber,
        commitId,
        comments,
      );

      if (githubReview) {
        console.log(`Posted GitHub review ${githubReview.id}`);
      } else {
        console.log("No review posted because no comments were generated");
      }

      return res.status(200).send("Webhook received");
    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(500).send("Internal server error");
    }
  },
);

app.listen(port, (error) => {
  if (error) {
    console.error(`Failed to start server on port ${port}:`, error);
    process.exitCode = 1;
    return;
  }

  console.log(`Server running on port ${port}`);
});
