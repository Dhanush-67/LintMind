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

  // Without Octokit, we would need to use fetch() and manually handle:

  // Constructing the GitHub URL
  // Selecting the POST HTTP method
  // Adding the installation-token authorization header
  // Adding GitHub’s required headers
  // Converting the JavaScript object into JSON
  // Parsing GitHub’s response
  // Producing an error when GitHub returns an unsuccessful status

  // The name can be read from left to right:

  // octokit: our authenticated GitHub client
  // .rest: use GitHub’s REST API
  // .pulls: use the pull-request group of endpoints
  // .createReview: call the endpoint that creates a PR review

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
