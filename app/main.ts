import { app, BrowserWindow, dialog, Menu, shell } from 'electron';
import * as fsExtra from 'fs-extra';
import * as path from 'path';

const { replayActionMain } = require('electron-redux');

import { createFfrkProxy } from './proxy/ffrk-proxy';
import { createOrLoadCertificate } from './proxy/tls';
import { configureStore, runSagas } from './store/configureStore.main';

import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;

/**
 * Hyperlinks that open in new windows instead open in a web browser.
 * See https://github.com/electron/electron/issues/1344#issuecomment-171516261
 * and our BrowserLink (target="_blank").
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
  if (process.env.NODE_ENV === 'development') {
    const installer = require('electron-devtools-installer'); // eslint-disable-line global-require

    const extensions = [
      'REACT_DEVELOPER_TOOLS',
      'REDUX_DEVTOOLS'
    ];
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    return Promise.all(extensions.map(name => installer.default(installer[name], forceDownload)));
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
      height: 728
    });

    mainWindow.loadURL(`file://${__dirname}/../../app/app.html`);

    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.show();
      mainWindow.focus();
    });

    enableBrowserLinks(mainWindow.webContents);

    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
      mainWindow.webContents.on('context-menu', (e, props) => {
        const { x, y } = props;

        Menu.buildFromTemplate([{
          label: 'Inspect element',
          click() {
            mainWindow.webContents.inspectElement(x, y);
          }
        }]).popup(mainWindow);
      });
    }

    // FIXME: Remaining standard menus - see https://github.com/electron/electron/blob/master/docs/api/menu.md

    if (process.platform === 'darwin') {
      const template: MenuItemConstructorOptions[] = [{
        label: 'RK Squared',
        submenu: [{
          label: 'About RK Squared',
          // selector: 'orderFrontStandardAboutPanel:'
          click() {
            dialog.showMessageBox({
              title: 'RK Squared',
              message: `RK Squared version ${app.getVersion()}`
            });
          }
        }, {
          type: 'separator'
        }, {
          label: 'Services',
          submenu: []
        }, {
          type: 'separator'
        }, {
          label: 'Hide RK Squared',
          accelerator: 'Command+H',
          // selector: 'hide:'
        }, {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          // selector: 'hideOtherApplications:'
        }, {
          label: 'Show All',
          // selector: 'unhideAllApplications:'
        }, {
          type: 'separator'
        }, {
          label: 'Quit',
          accelerator: 'Command+Q',
          click() {
            quitApp();
          }
        }]
      }, {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      }, {
        label: 'View',
        submenu: (process.env.NODE_ENV === 'development') ? [{
          label: 'Reload',
          accelerator: 'Command+R',
          click() {
            mainWindow.webContents.reload();
          }
        }, {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click() {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }, {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click() {
            mainWindow.webContents.toggleDevTools();
          }
        }] : [{
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click() {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }]
      }, {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
          { type: 'separator' },
          { role: 'front' },
        ]
      }, {
        label: 'Help',
        submenu: [{
          label: 'Learn More',
          click() {
            shell.openExternal('http://electron.atom.io');
          }
        }, {
          label: 'Documentation',
          click() {
            shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme');
          }
        }, {
          label: 'Community Discussions',
          click() {
            shell.openExternal('https://discuss.atom.io/c/electron');
          }
        }, {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/atom/electron/issues');
          }
        }]
      }];

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    } else {
      const template: MenuItemConstructorOptions[] = [{
        label: '&File',
        submenu: [{
          label: '&Open',
          accelerator: 'Ctrl+O'
        }, {
          label: '&Close',
          accelerator: 'Ctrl+W',
          click() {
            mainWindow.close();
          }
        }]
      }, {
        label: '&View',
        submenu: (process.env.NODE_ENV === 'development') ? [{
          label: '&Reload',
          accelerator: 'Ctrl+R',
          click() {
            mainWindow.webContents.reload();
          }
        }, {
          label: 'Toggle &Full Screen',
          accelerator: 'F11',
          click() {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }, {
          label: 'Toggle &Developer Tools',
          accelerator: 'Alt+Ctrl+I',
          click() {
            mainWindow.webContents.toggleDevTools();
          }
        }] : [{
          label: 'Toggle &Full Screen',
          accelerator: 'F11',
          click() {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }]
      }, {
        label: 'Help',
        submenu: [{
          label: 'Learn More',
          click() {
            shell.openExternal('http://electron.atom.io');
          }
        }, {
          label: 'Documentation',
          click() {
            shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme');
          }
        }, {
          label: 'Community Discussions',
          click() {
            shell.openExternal('https://discuss.atom.io/c/electron');
          }
        }, {
          label: 'Search Issues',
          click() {
            shell.openExternal('https://github.com/atom/electron/issues');
          }
        }]
      }];
      const menu = Menu.buildFromTemplate(template);
      mainWindow.setMenu(menu);
    }

    const userDataPath = app.getPath('userData');
    fsExtra.ensureDirSync(userDataPath);
    createOrLoadCertificate(userDataPath);
    createFfrkProxy(store, userDataPath);
  })
);

app.on('window-all-closed', () => {
  quitApp();
});
