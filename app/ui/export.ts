import { BrowserWindow, dialog, FileFilter, MenuItemConstructorOptions } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Store } from 'redux';

import { getLastFilename, setLastFilename } from '../actions/prefs';
import { IState } from '../reducers';

const fileTypes = {
  JSON: [
    {
      name: 'JSON',
      extensions: ['json'],
    },
  ],
  CSV: [
    {
      name: 'Comma-Separated Values',
      extensions: ['csv'],
    },
  ],
};

interface ExportMenuItem {
  id: string;
  label: string;
  type: keyof typeof fileTypes;
  defaultFilename: string;
  exporter: (state: IState) => string;
}

export function makeExportMenuItem(
  store: Store<IState>,
  window: BrowserWindow,
  { id, label, type, defaultFilename, exporter }: ExportMenuItem,
): MenuItemConstructorOptions {
  return {
    id,
    label: `${label} (${type})...`,
    click: () => {
      const lastFilename = getLastFilename(store.getState().prefs, id, defaultFilename);
      handleExport(window, lastFilename, fileTypes[type], (filename: string) => {
        store.dispatch(setLastFilename(id, path.basename(filename, path.extname(filename))));
        return exporter(store.getState());
      });
    },
  };
}

export function handleExport(
  window: BrowserWindow,
  defaultPath: string,
  filters: FileFilter[],
  callback: (filename: string) => string,
) {
  dialog.showSaveDialog(
    window,
    {
      defaultPath,
      filters,
    },
    (filename?: string) => {
      if (!filename) {
        return;
      }
      fs.writeFile(filename, callback(filename)).catch(e =>
        dialog.showMessageBox(window, {
          title: 'Error',
          type: 'error',
          message: `Failed to write ${filename}:\n${e}`,
        }),
      );
    },
  );
}
