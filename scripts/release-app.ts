#!/usr/bin/env -S npx ts-node

import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as process from 'process';
import * as querystring from 'querystring';

import * as dotenv from 'dotenv';
import * as _ from 'lodash';
import * as github from 'octonode';
import * as open from 'open';

// tslint:disable no-console

dotenv.config();

function updatePackageJson(version: string): boolean {
  const packageJson = fs.readJsonSync('package.json');
  if (packageJson.version === version) {
    return false;
  }

  console.log('Updating package.json');
  packageJson.version = version;
  fs.writeJsonSync('package.json', packageJson, { spaces: 2 });
  return true;
}

function hasUncommittedChanges(): boolean {
  return child_process.execSync('git status --porcelain', { encoding: 'utf8' }) === '';
}

function commitChanges(version: string) {
  child_process.execSync(`git commit -a -m "${version} release"`);
}

function tagReleaseIfNeeded(tag: string): boolean {
  try {
    child_process.execSync(`git rev-parse --verify --quiet ${tag}`);
    console.log('Git tag already exists. Skipping.');
    return false;
  } catch (e) {}

  child_process.execSync(`git tag ${tag}`);
  child_process.execSync(`git push --tags`);
  return true;
}

function readReleaseNotes(version: string): string {
  const changelog = fs.readFileSync('CHANGELOG.md', { encoding: 'utf8' });
  const re = new RegExp('^# v' + version + '\n(.*?)\n# ', 'sm');
  const m = changelog.match(re);
  if (!m) {
    throw new Error('Failed to parse changelog');
  }
  return m[1].trim();
}

async function uploadReleaseAsset(ghRelease: any, filename: string) {
  const releaseDir = 'release';
  const assetPath = path.join(releaseDir, filename);
  if (!fs.existsSync(assetPath)) {
    console.log(`${assetPath} does not exist; skipping`);
    return 0;
  }

  const asset = await fs.readFile(assetPath);
  await ghRelease.uploadAssetsAsync(asset, {
    name: filename,
    contentType: 'application/zip',
    uploadHost: 'uploads.github.com',
  });
  return 1;
}

function showRedditDraft(version: string, releaseNotes: string) {
  console.log(`RK Squared ${version} - track soul breaks, LMs, relic banners, etc.`);
  console.log(
    `Version ${version} of RK Squared is now available. ` +
      'You can get it [here](https://www.rk-squared.com/). ' +
      'RK² is a record keeper for Final Fantasy Record Keeper. It can track item drops, dungeon completion status, dungeon rewards, record materia, soul breaks, legend materia, and relic banners for both the Android and iOS versions of the game.\n\n' +
      'New features and changes since the last release:\n\n' +
      releaseNotes +
      '\n\n' +
      'As a reminder, some of the same content is available on [rk-squared.com](https://www.rk-squared.com/) - although using the application lets you track your own inventory, dungeon progress, etc.\n\n' +
      'As always, feedback and suggestions are welcome.',
  );
}

async function main() {
  const version = process.argv[2];
  if (!version || !version.match(/^\d+\.\d+\.\d+$/)) {
    console.error(`Usage: ${__filename} version`);
    process.exit(2);
  }
  const tag = 'v' + version;

  const ignoreUncommittedChanges = !!process.env['IGNORE_UNCOMMITTED_CHANGES'];

  process.chdir(path.dirname(__dirname));

  if (!ignoreUncommittedChanges && !hasUncommittedChanges()) {
    console.error('Uncommitted changes. Please commit before continuing.');
    process.exit(1);
  }

  if (updatePackageJson(version)) {
    commitChanges(version);
  }

  tagReleaseIfNeeded(tag);
  console.log();

  const releaseNotes = readReleaseNotes(version);
  console.log('Release notes:');
  console.log(releaseNotes);
  console.log();

  const repoName = 'rk-squared/rk-squared';
  if (!process.env.GITHUB_TOKEN) {
    console.error('No GITHUB_TOKEN in the environment. Unable to continue.');
    process.exit(1);
  }
  const client = github.client(process.env.GITHUB_TOKEN);
  const ghRepo = client.repo(repoName);
  console.log('Checking for previous GitHub release drafts...');
  const releases = await ghRepo.releasesAsync();
  let release = _.find(releases[0], r => r.tag_name === tag);
  let assetsUploaded = 0;
  if (release) {
    console.log(`Found previous draft:`);
    console.log(release.html_url);
    assetsUploaded = release.assets.length;
  } else {
    console.log('Drafting new GitHub release...');
    release = await ghRepo.releaseAsync({
      name: 'Version ' + version,
      tag_name: tag,
      draft: true,
      body: releaseNotes,
    });
    release = release[0];
  }
  const releaseId = release.id;
  console.log(`Release draft is ${releaseId}`);
  const ghRelease = client.release(repoName, releaseId);
  console.log();

  const allAssets = [
    ['Windows', `RK Squared Setup ${version}.exe`],
    ['Mac', `RK Squared-${version}.dmg`],
  ];
  for (const [osName, assetFile] of allAssets) {
    console.log(`Uploading ${osName} release...`);
    assetsUploaded += await uploadReleaseAsset(ghRelease, assetFile);
  }
  if (assetsUploaded < allAssets.length) {
    console.log('Missing one or more assets. Aborting.');
    return;
  }

  showRedditDraft(version, releaseNotes);

  const draftTag = path.basename(release.html_url);
  open(`https://github.com/rk-squared/rk-squared/releases/edit/${draftTag}`);
  const postTitle = `RK Squared ${version} - track soul breaks, LMs, relic banners, etc.`;
  open(
    'https://www.reddit.com/r/FFRecordKeeper/submit?selftext=true&title=' +
      querystring.escape(postTitle),
  );
}

main().catch(e => console.error(e));
