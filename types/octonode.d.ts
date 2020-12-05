declare module 'octonode' {
  // FIXME: Very incomplete! Possibly wrong! Just enough to let it type-check!

  export interface Client {
    repo(repoName: string): Repo;
    release(repoName: string, releaseId: string): any;
  }

  export interface Repo {
    releasesAsync(): Promise<Release[][]>;
    releaseAsync(release: Partial<Release>): Promise<Release[]>;
  }

  // https://docs.github.com/en/free-pro-team@latest/rest/reference/repos#list-releases
  export interface Release {
    html_url: string;
    tag_name: string;
    id: string;
    name: string;
    draft: boolean;
    body: string;
    assets: Asset[];
  }

  export interface Asset {
    url: string;
    browser_download_url: string;
    name: string;
    label: string;
  }

  export function client(token: string): Client;
}
