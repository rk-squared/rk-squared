/**
 * @file
 * Generic utility functions shared by proxy handlers.  Some overlap with
 * common.ts - we try to keep domain-specific logic there instead of here.
 */

import * as fsExtra from 'fs-extra';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import * as zlib from 'zlib';

/**
 * Returns a list of IP addresses of the host computer, in string form.  Based
 * on https://stackoverflow.com/a/8440736/25507.
 */
export function getIpAddresses() {
  const interfaces = os.networkInterfaces();
  const result: string[] = [];

  Object.keys(interfaces).forEach(ifname => {
    interfaces[ifname]!.forEach(iface => {
      if ('IPv4' !== iface.family || iface.internal) {
        // skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
        return;
      }

      result.push(iface.address);
    });
  });

  return result;
}

// FIXME: Globals are bad
let storagePath = __dirname;

export function setStoragePath(name: string) {
  storagePath = name;
}

export function getStoragePath(name?: string) {
  if (name == null) {
    return storagePath;
  } else {
    const result = path.join(storagePath, name);
    fsExtra.ensureDirSync(result);
    return result;
  }
}

export function decodeData(data: Buffer, res: http.ServerResponse) {
  if (res.getHeader('content-encoding')) {
    return zlib.gunzipSync(data);
  } else {
    return data;
  }
}

export function encodeData(data: string, res: http.ServerResponse) {
  if (res.getHeader('content-encoding')) {
    return zlib.gzipSync(data);
  } else {
    return Buffer.from(data);
  }
}
