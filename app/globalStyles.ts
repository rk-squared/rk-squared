import * as Modal from 'react-modal';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faApple } from '@fortawesome/free-brands-svg-icons/faApple';
import { faWindows } from '@fortawesome/free-brands-svg-icons/faWindows';
import { faArchive } from '@fortawesome/free-solid-svg-icons/faArchive';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown';
import { faCertificate } from '@fortawesome/free-solid-svg-icons/faCertificate';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { faCog } from '@fortawesome/free-solid-svg-icons/faCog';
import { faDiceD20 } from '@fortawesome/free-solid-svg-icons/faDiceD20';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons/faEllipsisH';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons/faExclamationTriangle';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons/faExternalLinkAlt';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faLockOpen } from '@fortawesome/free-solid-svg-icons/faLockOpen';
import { faQuestion } from '@fortawesome/free-solid-svg-icons/faQuestion';
import { faSearch } from '@fortawesome/free-solid-svg-icons/faSearch';
import { faStar } from '@fortawesome/free-solid-svg-icons/faStar';
import { faUnlock } from '@fortawesome/free-solid-svg-icons/faUnlock';

// https://stackoverflow.com/a/37480521/25507
// We could use jQuery Slim, but if we use that, our bundle still pulls in
// jQuery.  (Why?)  Should we use a CDN here instead?
const w = window as any;
w.$ = w.jQuery = require('jquery');
require('popper.js');
require('bootstrap');

import '@ag-grid-community/core/dist/styles/ag-grid.css';
import '@ag-grid-community/core/dist/styles/ag-theme-balham.css';

import './app.global.scss';

library.add(
  faApple as any,
  faArchive as any,
  faArrowDown as any,
  faCertificate as any,
  faCheck as any,
  faChevronDown as any,
  faCog as any,
  faDiceD20 as any,
  faEllipsisH as any,
  faExclamationTriangle as any,
  faExternalLinkAlt as any,
  faLock as any,
  faLockOpen as any,
  faQuestion as any,
  faSearch as any,
  faStar as any,
  faUnlock as any,
  faWindows as any,
);

export function initializeGlobalStyles(rootNode: HTMLElement) {
  Modal.setAppElement(rootNode);
}
