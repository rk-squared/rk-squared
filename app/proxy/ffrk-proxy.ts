import * as cheerio from 'cheerio';
import * as connect from 'connect';
import * as fs from 'fs';
import * as http from 'http';
import * as httpProxy from 'http-proxy';
import * as moment from 'moment';
import * as net from 'net';
import * as path from 'path';
import * as querystring from 'querystring';
import * as streamBuffers from 'stream-buffers';
import * as url from 'url';

import { Store } from 'redux';

const transformerProxy = require('transformer-proxy');

import { decodeData, encodeData, getIpAddresses, getStoragePath, setStoragePath } from './util';

import battle from './battle';
import characters from './characters';
import dungeons from './dungeons';
import itemUpdates from './itemUpdates';
import options from './options';
import recordMateria from './recordMateria';
import { sessionHandler } from './session';
import { StartupHandler } from './types';

import { updateLastTraffic, updateProxyStatus } from '../actions/proxy';
import { IState } from '../reducers';

import * as _ from 'lodash';

interface ProxyIncomingMessage extends http.IncomingMessage {
  bodyStream: streamBuffers.WritableStreamBuffer | undefined;
  body: any | undefined;
}

const handlers = [
  battle,
  characters,
  dungeons,
  itemUpdates,
  recordMateria,

  // Apply options last so that changes that options make won't interfere with
  // other processing.
  options,
];

// FIXME: Proper logging library
// tslint:disable no-console

const ffrkRegex = /ffrk\.denagames\.com\/dff/;

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

let capturePath: string;

function getCaptureFilename(req: http.IncomingMessage) {
  if (req.url == null) {
    throw new Error('No URL included in request');
  }
  if (capturePath == null) {
    capturePath = getStoragePath('captures');
  }
  const datestamp = moment().format('YYYY-MM-DD-HH-mm-ss-SSS');
  const urlPath = url.parse(req.url).pathname!.replace(/\//g, '_');
  return path.join(capturePath, datestamp + urlPath + '.json');
}

function checkRequestBody(req: http.IncomingMessage) {
  const proxyReq = req as ProxyIncomingMessage;
  if (proxyReq.bodyStream == null) {
    return;
  }
  proxyReq.body = proxyReq.bodyStream.getContentsAsString('utf8');
  try {
    proxyReq.body = JSON.parse(proxyReq.body);
  } catch (e) {
  }
}

function recordCapturedData(data: any, req: http.IncomingMessage, res: http.ServerResponse) {
  const filename = getCaptureFilename(req);
  const { url, method, headers } = req;  // tslint:disable-line no-shadowed-variable
  const response = { headers: res.getHeaders() };

  const proxyReq = req as ProxyIncomingMessage;
  const requestBody = proxyReq.body;

  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify({ url, method, headers, requestBody, response, data }, null, 2), err => {
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

function getFragmentsToCheck(reqUrl: url.UrlWithStringQuery) {
  const urlPathname = reqUrl.pathname as string;
  const urlParts = urlPathname.split('/');

  // URL fragments to check.  We key most URLs using the last fragment (e.g.,
  // "/dff/event/challenge/942/get_battle_init_data" becomes
  // "get_battle_init_data"), but we also check check the last two fragments
  // to handle cases like "/dff/beast/list".
  const fragments = [urlParts[urlParts.length - 1]];
  if (urlParts.length > 1) {
    fragments.push(urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1]);
  }

  return fragments;
}

function checkHandlers(
  data: {},
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: Store<IState>,
  fragments?: Array<string | symbol>
) {
  const reqUrl = url.parse(req.url as string);
  const reqQuery = reqUrl.query ? querystring.parse(reqUrl.query) : undefined;
  const reqBody = (req as ProxyIncomingMessage).body;
  if (fragments == null) {
    fragments = getFragmentsToCheck(reqUrl);
  }

  let changed = false;
  for (const handler of handlers) {
    for (const fragment of fragments) {
      if (handler[fragment]) {
        const newData = handler[fragment](data, store, reqQuery, reqBody);
        if (newData !== undefined) {
          changed = true;
          data = newData;
        }
        break;
      }
    }
  }
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

    checkRequestBody(req);

    if (store.getState().options.saveTrafficCaptures) {
      recordCapturedData(decoded, req, res)
        .catch(err => console.error(`Failed to save data capture: ${err}`))
        .then(filename => console.log(`Saved to ${filename}`));
    }

    sessionHandler(decoded, req, res, store);

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
    if (store.getState().options.saveTrafficCaptures) {
      recordCapturedData(startupData, req, res)
        .catch(err => console.error(`Failed to save data capture: ${err}`))
        .then(filename => console.log(`Saved to ${filename}`));
    }

    checkHandlers(startupData, req, res, store, [StartupHandler]);
  } catch (error) {
    console.error(error);
  }
  return data;
}


export function createFfrkProxy(store: Store<IState>, userDataPath: string) {
  setStoragePath(userDataPath);
  store.dispatch(updateProxyStatus({ capturePath: userDataPath }));

  // FIXME: Need error handling somewhere in here
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
  proxy.on('error', e => {
    console.log('Error within proxy');
    console.log(e);
  });

  const app = connect();

  app.use(transformerProxy(transformerFunction, { match: ffrkRegex }));
  // Disabled; not currently functional:
  // app.use(transformerProxy(cacheTransformerFunction, { match: /127\.0\.0\.1/ }));

  app.use((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    console.log(req.url);
    store.dispatch(updateLastTraffic());
    // console.log(req.headers);
    next();
  });

  app.use((req: http.IncomingMessage, res: http.ServerResponse) => {
    req.on('error', e => {
      console.log('Error within proxy req');
      console.log(e);
    });
    res.on('error', e => {
      console.log('Error within proxy res');
      console.log(e);
    });

    // Disabled; not currently functional:
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

    if (req.url && req.url.match(ffrkRegex) && req.method === 'POST') {
      const proxyReq = req as ProxyIncomingMessage;
      proxyReq.bodyStream = new streamBuffers.WritableStreamBuffer();
      req.pipe(proxyReq.bodyStream);
    }

    proxy.web(req, res, {
      target: `http://${req.headers.host}/`
    });
  });

  const server = http.createServer(app);

  server.on('error', e => {
    console.log('Error within server');
    console.log(e);
  });

  // Proxy (tunnel) HTTPS requests.  For more information:
  // https://nodejs.org/api/http.html#http_event_connect
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT
  server.on('connect', (req, clientSocket, head) => {
    console.log(`CONNECT ${req.url}`);
    store.dispatch(updateLastTraffic());

    const serverUrl = url.parse(`https://${req.url}`);
    const serverPort = +(serverUrl.port || 80);

    let connected = false;
    const serverSocket = net.connect(serverPort, serverUrl.hostname, () => {
      connected = true;

      clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
        'Proxy-agent: Node.js-Proxy\r\n' +
        '\r\n');
      serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    }).on('error', (e: Error) => {
      console.log(`Error ${connected ? 'communicating with' : 'connecting to'} ${serverUrl.hostname}`);
      console.log(e);
      if (!connected) {
        // Unable to connect to destination - send a clean error back to the client
        clientSocket.end('HTTP/1.1 502 Bad Gateway\r\n' +
          'Proxy-agent: Node.js-Proxy\r\n' +
          '\r\n' +
          e);
      } else {
        // An error occurred in mid-connection - abort the client connection so
        // the client knows.
        clientSocket.destroy();
      }
    });
    clientSocket.on('error', (e: Error) => {
      console.log(`Error communicating with ${serverUrl.hostname}`);
      console.log(e);
      serverSocket.destroy();
    });
  });

  const port = 8888;

  let ipAddress: string[];
  const updateNetwork = () => {
    const newIpAddress = getIpAddresses();
    if (!_.isEqual(newIpAddress, ipAddress)) {
      ipAddress = newIpAddress;
      console.log(`Listening on ${ipAddress.join(',')}, port ${port}`);
      store.dispatch(updateProxyStatus({ ipAddress, port }));
    }
  };
  updateNetwork();
  setInterval(updateNetwork, 60 * 1000);

  server.listen(port);
}
