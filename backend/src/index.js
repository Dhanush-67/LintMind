import express from "express";
import crytpo from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

app.get("/", (req, res) => {
  res.send("LintMind backend is running");
});

app.post(
  "/api/github/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
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

    const isValid =
      signature &&
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

    res.status(200).send("Webhook received");
  },
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
