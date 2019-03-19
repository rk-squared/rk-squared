import * as React from 'react';

export const BrowserLink = ({ children, ...props }: any) => (
  <a target="_blank" {...props}>
    {children}
  </a>
);
