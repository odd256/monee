export class GithubError extends Error {
  readonly status: number;
  readonly rateLimitReset?: number;

  constructor(status: number, message: string, rateLimitReset?: number) {
    super(message);
    this.name = "GithubError";
    this.status = status;
    this.rateLimitReset = rateLimitReset;
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isConflict(): boolean {
    return this.status === 409 || this.status === 422;
  }

  get userMessage(): string {
    if (this.status === 401) return "GitHub Token 无效或已过期。";
    if (this.status === 403) {
      return this.rateLimitReset
        ? `GitHub API 访问受限，请稍后重试。`
        : "没有访问该仓库的权限，请检查 Token 权限。";
    }
    if (this.status === 404) return "仓库不存在，或 Token 没有访问权限。";
    if (this.status === 409 || this.status === 422) {
      return "远端数据已变化，同步冲突，请重试。";
    }
    return this.message || "GitHub 请求失败。";
  }
}

export function isGithubError(error: unknown): error is GithubError {
  return error instanceof GithubError;
}
