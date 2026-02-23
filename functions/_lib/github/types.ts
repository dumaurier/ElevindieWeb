export interface GitHubFileResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

export interface GitHubCommitResponse {
  content: {
    name: string;
    path: string;
    sha: string;
  };
  commit: {
    sha: string;
    message: string;
  };
}

export interface Env {
  GITHUB_TOKEN: string;
  GITHUB_REPO_OWNER: string;
  GITHUB_REPO_NAME: string;
  GITHUB_BRANCH: string;
  SITE_URL: string;
  TOKEN_ENDPOINT: string;
  ME: string;
  // Syndication — optional, feature activates when tokens are present
  BLUESKY_HANDLE?: string;
  BLUESKY_APP_PASSWORD?: string;
  BLUESKY_PDS_URL?: string;
  MASTODON_INSTANCE_URL?: string;
  MASTODON_ACCESS_TOKEN?: string;
  // Webhook — optional, for syndication via direct git commits
  GITHUB_WEBHOOK_SECRET?: string;
}
