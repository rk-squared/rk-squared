import { BrowserWindow, dialog, FileFilter } from 'electron';
import * as fs from 'fs-extra';

export const jsonFilters: FileFilter[] = [
  {
    name: 'JSON',
    extensions: ['json'],
  },
];
export const csvFilters: FileFilter[] = [
  {
    name: 'Comma-Separated Values',
    extensions: ['csv'],
  },
];

export function handleExport(
  window: BrowserWindow,
  defaultPath: string,
  filters: FileFilter[],
  callback: () => string,
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
      fs.writeFile(filename, callback()).catch(e =>
        dialog.showMessageBox(window, {
          title: 'Error',
          type: 'error',
          message: `Failed to write ${filename}:\n${e}`,
        }),
      );
    },
  );
}
