import * as Modal from 'react-modal';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faArchive } from '@fortawesome/pro-solid-svg-icons/faArchive';
import { faArrowDown } from '@fortawesome/pro-solid-svg-icons/faArrowDown';
import { faCheck } from '@fortawesome/pro-solid-svg-icons/faCheck';
import { faCoffeeTogo } from '@fortawesome/pro-solid-svg-icons/faCoffeeTogo';
import { faEllipsisH } from '@fortawesome/pro-solid-svg-icons/faEllipsisH';
import { faExternalLink } from '@fortawesome/pro-solid-svg-icons/faExternalLink';
import { faLock } from '@fortawesome/pro-solid-svg-icons/faLock';
import { faLockOpen } from '@fortawesome/pro-solid-svg-icons/faLockOpen';
import { faQuestion } from '@fortawesome/pro-solid-svg-icons/faQuestion';
import { faStar } from '@fortawesome/pro-solid-svg-icons/faStar';
import { faUnlock } from '@fortawesome/pro-solid-svg-icons/faUnlock';

// https://stackoverflow.com/a/37480521/25507
// We could use jQuery Slim, but if we use that, our bundle still pulls in
// jQuery.  (Why?)  Should we use a CDN here instead?
const w = window as any;
w.$ = w.jQuery = require('jquery');
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
