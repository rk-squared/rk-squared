import * as React from 'react';

/**
 * See enableBrowserLinks.
 */
export const BrowserLink = ({ children, ...props }: any) => (
  <a target="_blank" {...props}>
    {children}
  </a>
);
