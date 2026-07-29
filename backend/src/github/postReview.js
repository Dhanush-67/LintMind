export async function postPullRequestReview(
  octokit,
  owner,
  repo,
  pullNumber,
  commitId,
  comments,
) {
  if (comments.length === 0) {
    return null;
  }

  const githubComments = comments.map((comments) => ({
    path: comments.filename,
    line: comments.line,
    side: "RIGHT",
    body: comments.body,
  }));

  const response = await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    commit_id: commitId,
    event: "COMMENT",
    body: `Lintmind found ${comments.length} issues in this pull request.`,
    comments: githubComments,
  });

  return response.data;
}
