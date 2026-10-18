export interface GithubUser {
  login: string;
  id: number;
  name: string | null;
  avatar_url: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  private: boolean;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export interface GithubRef {
  ref: string;
  object: {
    sha: string;
    type: string;
  };
}

export interface GithubCommit {
  sha: string;
  tree: {
    sha: string;
  };
}

export interface GithubTreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
}

export interface GithubTree {
  sha: string;
  tree: GithubTreeEntry[];
  truncated: boolean;
}

export interface GithubBlob {
  sha: string;
  content: string;
  encoding: string;
}

export interface GithubContent {
  name: string;
  path: string;
  sha: string;
  content?: string;
  encoding?: string;
}

export interface GithubFileChange {
  path: string;
  sha: string | null;
}
