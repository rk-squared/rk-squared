import * as fs from 'fs';
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
    interfaces[ifname].forEach(iface => {
      if ('IPv4' !== iface.family || iface.internal) {
        // skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
        return;
      }

      result.push(iface.address);
    });
  });

  return result;
}

export function getStoragePath(name: string) {
  const storagePath = path.join(__dirname, name);
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath);
  }
  return storagePath;
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

