import * as Modal from 'react-modal';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faArchive,
  faArrowDown,
  faCheck,
  faCoffeeTogo,
  faEllipsisH,
  faExternalLink,
  faLock,
  faLockOpen,
  faQuestion,
  faStar,
  faUnlock,
} from '@fortawesome/pro-solid-svg-icons';

// https://stackoverflow.com/a/37480521/25507
const w = window as any;
w.$ = w.jQuery = require('jquery/dist/jquery.slim');
require('popper.js');
require('bootstrap');

import './app.global.scss';

library.add(
  faArchive,
  faArrowDown,
  faCheck,
  faCoffeeTogo,
  faEllipsisH,
  faExternalLink,
  faLock,
  faLockOpen,
  faQuestion,
  faStar,
  faUnlock,
);

export function initializeGlobalStyles(rootId: string) {
  Modal.setAppElement(rootId);
}
