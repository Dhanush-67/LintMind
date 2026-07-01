export async function getPullRequestFiles(octokit, owner, repo, pullNumber) {
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  return files;
}
