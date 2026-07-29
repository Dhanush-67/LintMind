import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

const appId = Number(process.env.GITHUB_APP_ID);
const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!Number.isInteger(appId)) {
  throw new Error("Invalid or missing GITHUB_APP_ID");
}

if (!privateKey) {
  throw new Error("Missing GITHUB_PRIVATE_KEY");
}

export async function getInstallationOctokit(installationId) {
  if (!Number.isInteger(installationId)) {
    throw new Error("Invalid installationId");
  }

  const auth = createAppAuth({
    appId,
    privateKey,
    installationId,
  });

  const installationAuthentication = await auth({
    type: "installation",
  });

  return new Octokit({
    auth: installationAuthentication.token,
  });
}
