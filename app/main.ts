import { app, BrowserWindow, dialog, Menu, MenuItemConstructorOptions, shell } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yargs from 'yargs';

const { replayActionMain } = require('electron-redux');

import { showDanger } from './actions/messages';
import { updateProxyStatus } from './actions/proxy';
import { rkSquaredUrl } from './data/resources';
import { createFfrkProxy, defaultHttpsPort, defaultPort } from './proxy/ffrk-proxy';
import { checkCertificate, createOrLoadCertificate } from './proxy/tls';
import {
  exportLegendMateriaToCsv,
  exportSoulBreaksToCsv,
  exportStateToJson,
} from './selectors/exporters';
import { configureStore, runSagas } from './store/configureStore.main';
import { makeExportMenuItem } from './ui/export';
import { logger, logToFile } from './utils/logger';

const enableDevTools = process.env.NODE_ENV === 'development';

const argv = yargs
  .option('rk-proxy-port', {
    default: defaultPort,
    number: true,
    description: 'Listen on this port for HTTP proxy traffic',
  })
  .option('rk-https-proxy-port', {
    default: defaultHttpsPort,
    number: true,
    description: 'Listen on this port for HTTPS proxy traffic (for iOS)',
  }).argv;

const validNumber = (n: number) => (n && !isNaN(n) ? n : undefined);

/**
 * Hyperlinks that open in new windows instead open in a web browser.
 * See https://github.com/electron/electron/issues/1344#issuecomment-171516261
 * and our BrowserLink (target="_blank").
 *
 * As of April 2019, some messages sent to showMessages may also manually use
 * target="_blank", relying on this behavior.
 */
function enableBrowserLinks(webContents: Electron.WebContents) {
  webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support'); // eslint-disable-line
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
  require('electron-debug')(); // eslint-disable-line global-require
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);

  // To facilitate running development builds, we point Electron directly at
  // the compiled TypeScript, but then Electron doesn't know its product name
  // and uses the wrong local storage directory.  As a workaround, manually set
  // the product directory.  Based on
  // https://github.com/SimulatedGREG/electron-vue/issues/424
  const { build } = require('../../package.json');
  const appData = app.getPath('appData');
  app.setPath('userData', path.join(appData, build.productName));
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const { store, persistor } = configureStore();
runSagas();
replayActionMain(store);

const installExtensions = () => {
  if (enableDevTools) {
    const installer = require('electron-devtools-installer'); // eslint-disable-line global-require

    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    return Promise.all(extensions.map((name) => installer.default(installer[name], forceDownload)));
  }

  return Promise.resolve([]);
};

const quitApp = () => {
  persistor.flush().then(() => app.quit());
};

app.on('ready', () =>
  installExtensions().then(() => {
    const mainWindow = new BrowserWindow({
      show: false,
      width: 1024,
      height: 728,
      // This was disabled by default starting in Electron 5, and it may add security risks if we
      // ever run code from untrusted sources, but our current application depends on it.
      webPreferences: {
        nodeIntegration: true,
      },
    });

    const mainUrl =
      process.env.NODE_ENV === 'development'
        ? `file://${__dirname}/../../app/app.html`
        : `file://${__dirname}/app.html`;
    logger.debug(`Loading ${mainUrl}`);
    mainWindow.loadURL(mainUrl);

    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.show();
      mainWindow.focus();
    });

    enableBrowserLinks(mainWindow.webContents);

    if (enableDevTools) {
      mainWindow.webContents.openDevTools();
      mainWindow.webContents.on('context-menu', (e, props) => {
        const { x, y } = props;

        Menu.buildFromTemplate([
          {
            label: 'Inspect element',
            click() {
              mainWindow.webContents.inspectElement(x, y);
            },
          },
        ]).popup({ window: mainWindow });
      });
    }

    // https://github.com/electron/electron/blob/master/docs/api/menu.md#main-process
    const isMac = process.platform === 'darwin';
    const template: MenuItemConstructorOptions[] = [
      // { role: 'appMenu' }
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
              ] as MenuItemConstructorOptions[],
            },
          ]
        : []),
      // { role: 'fileMenu' }
      {
        label: 'File',
        submenu: [
          {
            label: 'Export',
            submenu: [
              makeExportMenuItem(store, mainWindow, {
                id: 'soulBreakInventory',
                label: 'Soul Break Inventory',
                type: 'CSV',
                defaultFilename: 'Soul Breaks',
                exporter: exportSoulBreaksToCsv,
              }),
              makeExportMenuItem(store, mainWindow, {
                id: 'legendMateriaInventory',
                label: 'Legend Materia Inventory',
                type: 'CSV',
                defaultFilename: 'Legend Materia',
                exporter: exportLegendMateriaToCsv,
              }),
              { type: 'separator' },
              makeExportMenuItem(store, mainWindow, {
                id: 'allData',
                label: 'All Data',
                type: 'JSON',
                defaultFilename: 'rk-squared',
                exporter: exportStateToJson,
              }),
            ],
          },
          isMac ? { role: 'close' } : { role: 'quit' },
        ],
      },
      // { role: 'editMenu' }
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          ...(isMac
            ? ([
                // { role: 'pasteAndMatchStyle' },
                // { role: 'delete' },
                { role: 'selectAll' },
                { type: 'separator' },
                {
                  label: 'Speech',
                  submenu: [{ role: 'startspeaking' }, { role: 'stopspeaking' }],
                },
              ] as MenuItemConstructorOptions[])
            : ([
                // { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' },
              ] as MenuItemConstructorOptions[])),
        ],
      },
      // { role: 'viewMenu' }
      {
        label: 'View',
        submenu: [
          ...(enableDevTools
            ? [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
              ]
            : []),
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ] as MenuItemConstructorOptions[],
      },
      // { role: 'windowMenu' }
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(isMac
            ? [
                { type: 'separator' },
                { role: 'front' },
                // { type: 'separator' },
                // { role: 'window' }
              ]
            : [
                // { role: 'close' }
              ]),
        ] as MenuItemConstructorOptions[],
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: () => shell.openExternal(rkSquaredUrl),
          },
          ...(isMac
            ? []
            : [
                {
                  label: 'About',
                  click: () =>
                    dialog.showMessageBox({
                      title: 'RK Squared',
                      message: `RK Squared version ${app.getVersion()}`,
                    }),
                },
              ]),
        ] as MenuItemConstructorOptions[],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    const userDataPath = app.getPath('userData');
    fs.ensureDirSync(userDataPath);

    const logFilename = path.join(userDataPath, 'app.log');
    store.dispatch(updateProxyStatus({ logFilename }));
    if (store.getState().options.enableLogging) {
      logToFile(logFilename);
    }

    const tlsCert = createOrLoadCertificate(userDataPath, (error: string) =>
      store.dispatch(showDanger(error)),
    );

    const certWarnings = checkCertificate(tlsCert);
    if (certWarnings.length) {
      store.dispatch(updateProxyStatus({ certWarnings }));
    }

    createFfrkProxy(store, {
      userDataPath,
      port: validNumber(argv['rk-proxy-port']),
      httpsPort: validNumber(argv['rk-https-proxy-port']),
      tlsCert,
    });
  }),
);

app.on('window-all-closed', () => {
  quitApp();
});
