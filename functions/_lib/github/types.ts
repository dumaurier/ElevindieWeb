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
}
