import * as cheerio from 'cheerio';
import * as connect from 'connect';
import * as fs from 'fs';
import * as http from 'http';
import * as httpProxy from 'http-proxy';
import * as https from 'https';
import * as moment from 'moment';
import * as net from 'net';
import * as path from 'path';
import * as querystring from 'querystring';
import * as stream from 'stream';
import * as streamBuffers from 'stream-buffers';
import * as url from 'url';

import { Store } from 'redux';

import * as _ from 'lodash';

// TODO: Write a proper .d.ts type definition
// eslint-disable-next-line @typescript-eslint/no-var-requires
const transformerProxy = require('transformer-proxy');

import battle from './battle';
import characters from './characters';
import { StartupHandler, HandlerFunction } from './common';
import dungeons from './dungeons';
import dungeonScores from './dungeonScores';
import itemUpdates from './itemUpdates';
import labyrinth from './labyrinth';
import recordMateria from './recordMateria';
import relicDraws from './relicDraws';
import { checkSessionUrl, sessionHandler } from './session';

import { showMessage } from '../actions/messages';
import { updateLastTraffic, updateProxyStatus } from '../actions/proxy';
import { issuesUrl } from '../data/resources';
import { IState } from '../reducers';
import { logException, logger } from '../utils/logger';
import { escapeHtml } from '../utils/textUtils';
import { DnsResolver } from './dnsResolver';
import { getStyleOverrides } from './styles';
import { TlsCert, tlsSites } from './tls';
import { decodeData, encodeData, getIpAddresses, getStoragePath, setStoragePath } from './util';

interface ProxyIncomingMessage extends http.IncomingMessage {
  bodyStream: streamBuffers.WritableStreamBuffer | undefined;
  body: any | undefined;
}

const handlers = [
  battle,
  characters,
  dungeons,
  relicDraws,
  itemUpdates,
  recordMateria,
  dungeonScores,
  labyrinth,
];

const ffrkRegex = /ffrk\.denagames\.com\/dff|dff\.sp\.mbga\.jp\/dff/;
export const defaultPort = 8888;
export const defaultHttpsPort = 8889;

function isFfrkApiRequest(req: http.IncomingMessage) {
  return (
    req.headers['accept'] &&
    req.headers['accept']!.indexOf('application/json') !== -1 &&
    req.headers['x-requested-with'] === 'XMLHttpRequest'
  );
}

// Sample startup URLs:
//
// https://ffrk.denagames.com/dff/
// http://dff.sp.mbga.jp/dff/
// http://ffrk.denagames.com/dff/?timestamp=1566384964
//
// iOS uses HTTPS. Android uses HTTP.  The timestamp parameter is used for
// reloading the main page after battles.
const startupUrlRe = /^https?:\/\/(?:ffrk\.denagames\.com|dff\.sp\.mbga\.jp)\/dff\/(?:\?timestamp=\d+)?$/;
export function isFfrkStartupRequest(req: http.IncomingMessage) {
  return (
    req.url &&
    startupUrlRe.test(req.url) &&
    req.headers['accept'] &&
    req.headers['accept']!.indexOf('text/html') !== -1
  );
}

let capturePath: string;

function getCaptureFilename(req: http.IncomingMessage, extension: string) {
  if (req.url == null) {
    throw new Error('No URL included in request');
  }
  if (capturePath == null) {
    capturePath = getStoragePath('captures');
  }
  const datestamp = moment().format('YYYY-MM-DD-HH-mm-ss-SSS');
  const urlPath = url.parse(req.url).pathname!.replace(/\//g, '_');
  return path.join(capturePath, datestamp + urlPath + extension);
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
    // Leave body as a string.
  }
}

function recordRawCapturedData(data: any, req: http.IncomingMessage, extension: string) {
  const filename = getCaptureFilename(req, extension);

  return new Promise((resolve, reject) => {
    fs.writeFile(filename, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(filename);
      }
    });
  });
}

function recordCapturedData(data: any, req: http.IncomingMessage, res: http.ServerResponse) {
  const { url, method, headers } = req;
  const response = { headers: res.getHeaders() };

  const proxyReq = req as ProxyIncomingMessage;
  const requestBody = proxyReq.body;

  return recordRawCapturedData(
    JSON.stringify({ url, method, headers, requestBody, response, data }, null, 2),
    req,
    '.json',
  );
}

const UTF8_BOM = 0xfeff;

function extractJson($el: cheerio.Cheerio) {
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
  fragments?: string[],
  targetHandler?: HandlerFunction
) {
  const reqUrl = url.parse(req.url as string);
  const reqQuery = reqUrl.query ? querystring.parse(reqUrl.query) : undefined;
  const reqBody = (req as ProxyIncomingMessage).body;
  if (fragments == null) {
    fragments = getFragmentsToCheck(reqUrl);
  }

  let changed = false;
  if (targetHandler == null) {
    targetHandler = getHandlerFunction(fragments);
  }

  if (targetHandler) {
    const newData = targetHandler(data, store, {
      query: reqQuery,
      body: reqBody,
      url: reqUrl,
    });
    if (newData !== undefined) {
      changed = true;
      data = newData;
    }
  }
  return changed ? data : undefined;
}

function handleFfrkApiRequest(
  data: Buffer,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: Store<IState>,
) {
  try {
    const reqUrl = url.parse(req.url as string);
    const fragments = getFragmentsToCheck(reqUrl);
    const handlerFunction = getHandlerFunction(fragments);
    const isSessionUrl = checkSessionUrl(req);
    const saveTraffic = store.getState().options.saveTrafficCaptures;
    if (!(isSessionUrl || handlerFunction) && !saveTraffic) {
      sessionHandler({}, req, res, store);
      logger.debug(`Skip ${req.url} with not session and handler`);
      return data;
    }

    let decoded = decodeData(data, res).toString();
    if (decoded.charCodeAt(0) === UTF8_BOM) {
      decoded = decoded.substr(1);
    }
    decoded = JSON.parse(decoded);

    checkRequestBody(req);

    if (saveTraffic) {
      recordCapturedData(decoded, req, res)
        .catch((err) => logger.error(`Failed to save data capture: ${err}`))
        .then((filename) => logger.debug(`Saved to ${filename}`));
    }

    sessionHandler(decoded, req, res, store);

    const newData = checkHandlers(decoded, req, res, store, fragments, handlerFunction);
    if (newData !== undefined) {
      data = encodeData(String.fromCharCode(UTF8_BOM) + JSON.stringify(newData), res);
    }
  } catch (e) {
    logException(e);
  }
  return data;
}

function getHandlerFunction(fragments: string[]) {
  for (const handler of handlers) {
    for (const fragment of fragments) {
      if (handler[fragment]) {
        return handler[fragment];
      }
    }
  }
  return undefined;
}

function handleFfrkStartupRequest(
  data: Buffer,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  store: Store<IState>,
) {
  if (res.statusCode === 302 && res.hasHeader('Location')) {
    logger.debug(`Redirected to ${res.getHeader('Location')} on startup; ignoring`);
    return data;
  }

  try {
    const decoded = decodeData(data, res).toString();
    const $ = cheerio.load(decoded);

    const appInitData = extractJson($('script[data-app-init-data]'));
    const textMaster = extractJson($('#text-master'));
    const startupData = { appInitData, textMaster };
    if (store.getState().options.saveTrafficCaptures) {
      // Optionally save full startup data.  Disabled by default; it's big and
      // hard to work with.
      // eslint-disable-next-line no-constant-condition
      if (0) {
        recordRawCapturedData(decoded, req, '.html')
          .catch((err) => logger.error(`Failed to save raw data capture: ${err}`))
          .then((filename) => logger.debug(`Saved to ${filename}`));
      }
      recordCapturedData(startupData, req, res)
        .catch((err) => logger.error(`Failed to save data capture: ${err}`))
        .then((filename) => logger.debug(`Saved to ${filename}`));
    }

    sessionHandler(decoded, req, res, store);

    checkHandlers(startupData, req, res, store, [StartupHandler]);

    const styleOverrides = getStyleOverrides(store);
    if (styleOverrides) {
      $('head').append(`<style type="text/css">${styleOverrides}</style>`);
      return encodeData($.html(), res);
    }
  } catch (e) {
    logException(e);
  }
  return data;
}

function isCertUrl(reqUrl: url.UrlWithStringQuery) {
  return (
    ((reqUrl.host === 'www.rk-squared.com' || reqUrl.host === 'rk-squared.com') &&
      reqUrl.pathname === '/cert') ||
    (reqUrl.host === 'cert.rk-squared.com' && reqUrl.pathname === '/')
  );
}

function handleInternalRequests(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  certPem: string,
) {
  if (!req.url) {
    return false;
  }

  if (isCertUrl(url.parse(req.url))) {
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', 'attachment; filename=RKSquared.cer');
    res.write(Buffer.from(certPem));
    res.end();
    return true;
  }

  return false;
}

function showServerError(e: any, description: string, store: Store<IState>) {
  // Is it okay to treat *all* server errors as something to yell about?  E.g.,
  // errors within proxy connections seem to be routine, but I've only seen
  // server errors if something is already listening on the port.
  logger.error('Error from ' + description);
  logException(e);
  store.dispatch(
    showMessage({
      text: {
        __html:
          `<p>Error from ${description}: ` +
          escapeHtml(e.message) +
          '</p>' +
          "<p>Please check that you aren't running other network software that may interfere with RK&sup2;.</p>" +
          '<p class="mb-0">If you continue to have trouble, please file an issue at the ' +
          `<a href="${issuesUrl}" class="alert-link" target="_blank" rel="noopener">RK² issues page</a>.` +
          '</p>',
      },
      id: description,
      color: 'danger',
    }),
  );
}

function handleServerErrors(
  anyServer: http.Server | https.Server,
  description: string,
  store: Store<IState>,
) {
  anyServer.on('error', (e) => showServerError(e, description, store));
}

/**
 * Proxy (tunnel) HTTPS requests.  For more information:
 * https://nodejs.org/api/http.html#http_event_connect
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT
 */
function configureHttpsProxy(server: http.Server, store: Store<IState>, httpsPort: number) {
  server.on('connect', (req: http.IncomingMessage, clientSocket: net.Socket, head: Buffer) => {
    logger.debug(`CONNECT ${req.url}`);
    store.dispatch(updateLastTraffic());

    let serverUrl = url.parse(`https://${req.url}`);
    // Check for FFRK HTTPS requests in particular and proxy them internally.
    if (serverUrl.hostname && tlsSites.indexOf(serverUrl.hostname) !== -1) {
      serverUrl = url.parse(`https://127.0.0.1:${httpsPort}`);
    }
    const serverPort = +(serverUrl.port || 80);

    let connected = false;
    const serverSocket = net
      .connect(serverPort, serverUrl.hostname!, () => {
        connected = true;

        clientSocket.write(
          'HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Node.js-Proxy\r\n' + '\r\n',
        );
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
      })
      .on('error', (e: Error) => {
        logger.debug(
          `Error ${connected ? 'communicating with' : 'connecting to'} ${serverUrl.hostname}`,
        );
        logException(e, 'debug');
        if (!connected) {
          // Unable to connect to destination - send a clean error back to the client
          clientSocket.end(
            'HTTP/1.1 502 Bad Gateway\r\n' + 'Proxy-agent: Node.js-Proxy\r\n' + '\r\n' + e,
          );
        } else {
          // An error occurred in mid-connection - abort the client connection so
          // the client knows.
          clientSocket.destroy();
        }
      });
    clientSocket.on('error', (e: Error) => {
      logger.debug(`Error communicating with ${serverUrl.hostname}`);
      logException(e, 'debug');
      serverSocket.destroy();
    });
  });
}

function scheduleUpdateNetwork(store: Store<IState>, port: number) {
  let ipAddress: string[];
  const updateNetwork = () => {
    const newIpAddress = getIpAddresses();

    // macOS, for example, may briefly report no IP addresses when it first
    // wakes from sleep.  To avoid spamming bogus messages in that case, don't
    // dispatch updates if no IP addresses are available.
    if (!newIpAddress.length) {
      return;
    }

    if (!_.isEqual(newIpAddress, ipAddress)) {
      ipAddress = newIpAddress;
      logger.info(`Listening on ${ipAddress.join(',')}, port ${port}`);
      store.dispatch(updateProxyStatus({ ipAddress, port }));
    }
  };
  updateNetwork();
  setInterval(updateNetwork, 60 * 1000);
}

function configureApp(
  app: connect.Server,
  store: Store<IState>,
  proxy: httpProxy,
  tlsCert: TlsCert,
  getTarget: (req: http.IncomingMessage) => string | Promise<string>,
) {
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

  app.use(transformerProxy(transformerFunction, { match: ffrkRegex }));
  // Disabled; not currently functional:
  // app.use(transformerProxy(cacheTransformerFunction, { match: /127\.0\.0\.1/ }));

  app.use((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    logger.debug(req.url as string);
    store.dispatch(updateLastTraffic());
    // console.log(req.headers);
    next();
  });

  app.use((req: http.IncomingMessage, res: http.ServerResponse) => {
    req.on('error', (e) => {
      logger.debug('Error within proxy req');
      logException(e, 'debug');
    });
    res.on('error', (e) => {
      logger.debug('Error within proxy res');
      logException(e, 'debug');
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

    if (handleInternalRequests(req, res, tlsCert.ca)) {
      return;
    }

    let buffer: stream.Writable | undefined;
    if (req.url && req.url.match(ffrkRegex) && req.method === 'POST') {
      const proxyReq = req as ProxyIncomingMessage;
      proxyReq.bodyStream = new streamBuffers.WritableStreamBuffer();
      buffer = new stream.PassThrough();
      req.pipe(buffer);
      req.pipe(proxyReq.bodyStream);
    }

    Promise.resolve(getTarget(req)).then((target) => proxy.web(req, res, { buffer, target }));
  });
}

function createTlsApp(app: connect.Server) {
  const tlsApp = connect();

  tlsApp.use((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    const reqUrl = req.url as string;
    const host = req.headers.host;
    logger.debug(`TLS proxy: ${reqUrl}, Host: ${host}`);
    req.url = `https://${host}${reqUrl}`;
    app(req, res, next);
  });

  return tlsApp;
}

function sendServerError(res: http.ServerResponse, message: string) {
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(message),
    'Content-Type': 'text/plain',
  });
  res.end(message);
}

function createTransparentApp(store: Store<IState>, proxy: httpProxy, tlsCert: TlsCert) {
  const app = connect();
  const transparentApp = connect();

  transparentApp.use((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    const reqUrl = req.url as string;
    const host = req.headers.host;
    logger.debug(`Transparent proxy: ${reqUrl}, Host: ${host}`);
    if (!host) {
      sendServerError(res, 'Missing host header');
      return;
    }
    req.url = `http://${host}${reqUrl}`;
    app(req, res, next);
  });

  const resolver = new DnsResolver();
  configureApp(app, store, proxy, tlsCert, (req) => {
    const reqUrl = url.parse(req.url as string);
    return Promise.resolve(resolver.resolve(reqUrl.host!)).then(
      (address) => reqUrl.protocol + '//' + address,
    );
  });

  return transparentApp;
}

/**
 * Handler for http-proxy's proxyReq event to preserve HTTP headers' case on
 * outgoing requests.  http-proxy has built-in functionality to preserve HTTP
 * headers' case in incoming responses via its preserveHeaderKeyCase option.
 *
 * We do this to minimize the impact that RK Squared has on the data that
 * passes through it.
 */
function preserveProxyReqHeaderKeyCase(proxyReq: http.ClientRequest, req: http.IncomingMessage) {
  const rawHeaderKeyMap: _.Dictionary<string> = { connection: 'Connection' };
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    const key = req.rawHeaders[i];
    rawHeaderKeyMap[key.toLowerCase()] = key;
  }

  for (const key of proxyReq.getHeaderNames()) {
    if (rawHeaderKeyMap[key]) {
      const header = proxyReq.getHeader(key);
      if (header) {
        proxyReq.setHeader(rawHeaderKeyMap[key], header);
      }
    }
  }

  // Remove the Proxy-Connection header; Android apparently adds it itself if
  // a proxy is configured.  See https://stackoverflow.com/q/15460819/25507
  proxyReq.removeHeader('Proxy-Connection');
}

interface ProxyArgs {
  userDataPath: string;
  port?: number;
  httpsPort?: number;
  tlsCert: TlsCert;
}

export function createFfrkProxy(store: Store<IState>, proxyArgs: ProxyArgs) {
  const { userDataPath, tlsCert } = proxyArgs;
  setStoragePath(userDataPath);
  store.dispatch(updateProxyStatus({ capturePath: userDataPath }));
  const port = proxyArgs.port || defaultPort;
  const httpsPort = proxyArgs.httpsPort || defaultHttpsPort;

  const proxy = httpProxy.createProxyServer({ preserveHeaderKeyCase: true });
  proxy.on('error', (e) => {
    logger.debug('Error within proxy');
    logException(e, 'debug');
  });
  proxy.on('proxyReq', preserveProxyReqHeaderKeyCase);

  const app = connect();
  configureApp(app, store, proxy, tlsCert, (req) => {
    const reqUrl = url.parse(req.url as string);
    return reqUrl.protocol + '//' + reqUrl.host;
  });

  const tlsApp = createTlsApp(app);

  const server = http.createServer(app);
  const httpsServer = https.createServer(tlsCert, tlsApp);

  handleServerErrors(server, 'proxy server', store);
  handleServerErrors(httpsServer, 'HTTPS proxy server', store);

  configureHttpsProxy(server, store, httpsPort);

  scheduleUpdateNetwork(store, port);

  server.listen(port);
  httpsServer.listen(httpsPort, '127.0.0.1');
  logger.info(`Listening on 127.0.0.1 port ${httpsPort}`);
  if (store.getState().options.enableTransparentProxy) {
    const transparentApp = createTransparentApp(store, proxy, tlsCert);
    const transparentServer = http.createServer(transparentApp);
    handleServerErrors(transparentServer, 'transparent proxy server', store);
    transparentServer.listen(80);
    logger.info(`Listening on port 80`);
  }
}
