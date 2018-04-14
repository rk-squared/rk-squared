/**
 * @file
 * Incomplete support for replacing FFRK's built-in cache that runs on 127.0.0.1
 */

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as querystring from 'querystring';
import * as url from 'url';

import { decodeData, getStoragePath } from './util';

// FIXME: Proper logging library
// tslint:disable no-console

const cachePath = getStoragePath('cache');

function getCacheFilename(resourceUrl: string) {
  const urlPath = resourceUrl.replace(/\//g, '_');
  return path.join(cachePath, urlPath);
}

function recordCacheData(data: any, resourceUrl: string) {
  const filename = getCacheFilename(resourceUrl);

  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, err => {
      if (err) {
        reject(err);
      } else {
        resolve(filename);
      }
    });
  });
}

// tslint:disable max-line-length
/**
 * Attempts to parse an incoming HTTP request as a request for FFRK's internal
 * cache.  If successful, it returns the URL fragment of the asset being
 * requested.
 *
 * For example:
 *
 * http://127.0.0.1:26284/cache?fail_on_download_error=1&ver=t8vLffa19a4a0f1f28d916c0868fa4e5cd3f&url=static/ww/compile/en/js/direct/app/splash.js
 *
 * is parsed as
 *
 * static/ww/compile/en/js/direct/app/splash.js
 *
 * which corresponds to a URL of
 *
 * http://ffrk.denagames.com/dff/static/ww/compile/en/js/direct/app/splash.js
 *
 * TODO: Also need to properly distinguish between /cache and /dff/...
 * TODO: Also need to handle special requests like check_precache
 */
export function parseFfrkCacheRequest(req: http.IncomingMessage) {
  if (!(req.headers.host as string).match(/^127\.0\.0\.1:\d+$/) || req.url == null) {
    return undefined;
  }

  const cacheUrl = url.parse(req.url);
  if (cacheUrl.pathname == null) {
    return undefined;
  }

  if (cacheUrl.pathname.startsWith('/dff/')) {
    return cacheUrl.pathname.replace(/^\/dff\//, '');
  }

  if (cacheUrl.query == null) {
    return undefined;
  }

  return querystring.parse(cacheUrl.query)['url'] as string;
}
// tslint:enable max-line-length

// noinspection JSUnusedGlobalSymbols
export function cacheTransformerFunction(data: Buffer, req: http.IncomingMessage, res: http.ServerResponse) {
  const resourceUrl = parseFfrkCacheRequest(req);
  if (resourceUrl != null) {
    const decoded = decodeData(data, res);
    recordCacheData(decoded, resourceUrl)
      .catch(err => console.error(`Failed to save cache capture: ${err}`))
      .then(filename => console.log(`Saved to ${filename}`));
  }
  return data;
}
