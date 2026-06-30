import "dotenv/config";
import express from "express";
import crypto from "crypto";
import { getInstallationOctokit } from "./github/auth.js";

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

      console.log("Event:", event);
      console.log("Delivery:", delivery);
      console.log("Signature:", signature);

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
      console.log("Action:", payload.action);
      console.log("Repo:", payload.repository?.full_name);
      console.log("PR number:", payload.pull_request?.number);

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
      const pull_number = payload.pull_request.number;

      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number,
      });

      console.log(
        "Changed files:",
        files.map((file) => file.filename),
      );

      return res.status(200).send("Webhook received");
    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(500).send("Internal server error");
    }
  },
);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
