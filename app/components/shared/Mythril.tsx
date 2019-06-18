import * as React from 'react';

import { localIcons } from '../../data/localData';

interface Props {
  children: any;
  className?: string;
}

export const Mythril = ({ children, className }: Props) => (
  <span className={className}>
    {children}
    <img src={localIcons.mythril} style={{ height: '1em' }} />
  </span>
);
