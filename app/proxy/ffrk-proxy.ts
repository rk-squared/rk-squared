import * as cheerio from 'cheerio';
import * as connect from 'connect';
import * as fs from 'fs';
import * as http from 'http';
import * as httpProxy from 'http-proxy';
import * as moment from 'moment';
import * as net from 'net';
import * as path from 'path';
import * as url from 'url';

import { Store } from 'redux';

const transformerProxy = require('transformer-proxy');

import { decodeData, encodeData, getIpAddresses, getStoragePath } from './util';

import battle from './battle';
import options from './options';
import { Handler } from './types';

import { IState } from '../reducers';

const handlers: { [s: string]: Handler } = {
  battle,
  options,
};

// FIXME: Proper logging library
// tslint:disable no-console

function isFfrkApiRequest(req: http.IncomingMessage) {
  return req.headers['accept']
      && req.headers['accept']!.indexOf('application/json') !== -1
      && req.headers['x-requested-with'] === 'XMLHttpRequest';
}

function isFfrkStartupRequest(req: http.IncomingMessage) {
  return req.url === 'http://ffrk.denagames.com/dff/'
      && req.headers['accept']
      && req.headers['accept']!.indexOf('text/html') !== -1;
}

const capturePath = getStoragePath('captures');

function getCaptureFilename(req: http.IncomingMessage) {
  if (req.url == null) {
    throw new Error('No URL included in request');
  }
  const datestamp = moment().format('YYYY-MM-DD-HH-mm-ss-SSS');
  const urlPath = url.parse(req.url).pathname!.replace(/\//g, '_');
  return path.join(capturePath, datestamp + urlPath + '.json');
}

function recordCapturedData(data: any, req: http.IncomingMessage, res: http.ServerResponse) {
  const filename = getCaptureFilename(req);
  const { url, method, headers } = req;  // tslint:disable-line no-shadowed-variable
  const response = { headers: res.getHeaders() };

  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify({ url, method, headers, response, data }, null, 2), err => {
      if (err) {
        reject(err);
      } else {
        resolve(filename);
      }
    });
  });
}

const UTF8_BOM = 0xFEFF;

function extractJson($el: Cheerio) {
  const rawJson = $el.html();
  if (rawJson == null) {
    throw new Error('Failed to find data');
  } else {
    return JSON.parse(rawJson);
  }
}

function checkHandlers(data: {}, req: http.IncomingMessage, res: http.ServerResponse, store: Store<IState>) {
  const fragment = path.posix.basename(url.parse(req.url as string).pathname as string);
  let changed = false;
  Object.keys(handlers).forEach(k => {
    if (handlers[k][fragment]) {
      const newData = handlers[k][fragment](data, store);
      if (newData !== undefined) {
        changed = true;
        data = newData;
      }
    }
  });
  return changed ? data : undefined;
}

function handleFfrkApiRequest(
  data: Buffer,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: Store<IState>
) {
  try {
    let decoded = decodeData(data, res).toString();
    if (decoded.charCodeAt(0) === UTF8_BOM) {
      decoded = decoded.substr(1);
    }
    decoded = JSON.parse(decoded);

    recordCapturedData(decoded, req, res)
      .catch(err => console.error(`Failed to save data capture: ${err}`))
      .then(filename => console.log(`Saved to ${filename}`));

    const newData = checkHandlers(decoded, req, res, store);
    if (newData !== undefined) {
      data = encodeData(String.fromCharCode(UTF8_BOM) + JSON.stringify(newData), res);
    }
  } catch (error) {
    console.error(error);
  }
  return data;
}

function handleFfrkStartupRequest(
  data: Buffer,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: Store<IState>
) {
  try {
    const decoded = decodeData(data, res).toString();
    const $ = cheerio.load(decoded);

    const appInitData = extractJson($('script[data-app-init-data]'));
    const textMaster = extractJson($('#text-master'));
    const startupData = { appInitData, textMaster };
    recordCapturedData(startupData, req, res)
      .catch(err => console.error(`Failed to save data capture: ${err}`))
      .then(filename => console.log(`Saved to ${filename}`));

    checkHandlers(startupData, req, res, store);
  } catch (error) {
    console.error(error);
  }
  return data;
}


export function createFfrkProxy(store: Store<IState>) {
  function transformerFunction(data: Buffer, req: http.IncomingMessage, res: http.ServerResponse) {
    if (isFfrkApiRequest(req)) {
      return handleFfrkApiRequest(data, req, res, store);
    } else if (isFfrkStartupRequest(req)) {
      return handleFfrkStartupRequest(data, req, res, store);
    } else {
      return data;
    }
  }

  const proxy = httpProxy.createProxyServer({});
  proxy.on('error', e => console.log(e));

  const app = connect();

  app.use(transformerProxy(transformerFunction, { match: /ffrk\.denagames\.com\/dff/ }));
  // Disabled; not currently functional.
  // app.use(transformerProxy(cacheTransformerFunction, { match: /127\.0\.0\.1/ }));

  app.use((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    console.log(req.url);
    // console.log(req.headers);
    next();
  });

  app.use((req: http.IncomingMessage, res: http.ServerResponse) => {
    // Disabled; not currently functional.
    /*
    const resourceUrl = parseFfrkCacheRequest(req);
    if (resourceUrl != null) {
      proxy.web(req, res, {
        target: `http://ffrk.denagames.com/dff/${resourceUrl}`,
        ignorePath: true
      });
      return;
    }
    */

    proxy.web(req, res, {
      target: `http://${req.headers.host}/`
    });
  });

  const server = http.createServer(app);

  server.on('error', e => console.log(e));

  // Proxy (tunnel) HTTPS requests.  For more information:
  // https://nodejs.org/api/http.html#http_event_connect
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT
  server.on('connect', (req, clientSocket, head) => {
    console.log(`CONNECT ${req.url}`);
    // console.log(req.headers);
    const serverUrl = url.parse(`https://${req.url}`);
    const serverPort = +(serverUrl.port || 80);
    const serverSocket = net.connect(serverPort, serverUrl.hostname, () => {
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
        'Proxy-agent: Node.js-Proxy\r\n' +
        '\r\n');
      serverSocket.write(head);
      // noinspection TypeScriptValidateJSTypes  (WebStorm false positive?)
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });
  });

  const port = 8888;
  const addresses = getIpAddresses().join(',');
  console.log(`Listening on ${addresses}, port ${port}`);
  server.listen(port);
}
