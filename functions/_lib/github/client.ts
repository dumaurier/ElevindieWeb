import type { Env, GitHubFileResponse } from "./types.js";

export class GitHubClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(private env: Env) {
    this.baseUrl = `https://api.github.com/repos/${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}/contents`;
    this.headers = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "11ndtyweb-micropub",
    };
  }

  async getFile(path: string): Promise<{ content: string; sha: string } | null> {
    const url = `${this.baseUrl}/${path}?ref=${this.env.GITHUB_BRANCH}`;
    const response = await fetch(url, { headers: this.headers });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data: GitHubFileResponse = await response.json();
    const content = atob(data.content.replace(/\n/g, ""));
    return { content, sha: data.sha };
  }

  async createFile(path: string, content: string, message: string): Promise<void> {
    const url = `${this.baseUrl}/${path}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: this.env.GITHUB_BRANCH,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub create failed: ${response.status} ${body}`);
    }
  }

  async updateFile(path: string, content: string, sha: string, message: string): Promise<void> {
    const url = `${this.baseUrl}/${path}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        sha,
        branch: this.env.GITHUB_BRANCH,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub update failed: ${response.status} ${body}`);
    }
  }

  async deleteFile(path: string, sha: string, message: string): Promise<void> {
    const url = `${this.baseUrl}/${path}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.headers,
      body: JSON.stringify({
        message,
        sha,
        branch: this.env.GITHUB_BRANCH,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub delete failed: ${response.status} ${body}`);
    }
  }
}
