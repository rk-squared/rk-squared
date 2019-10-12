import * as React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';

export const SiteExternalLink = ({ children, className, ...props }: any) => (
  <a target="_blank" rel="noopener" className={classNames('text-reset', className)} {...props}>
    {children} <FontAwesomeIcon icon="external-link" />
  </a>
);
