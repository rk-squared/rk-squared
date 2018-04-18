import * as React from 'react';

const BrowserLink = ({children, ...props}: any) => (
  <a target="_blank" {...props}>{children}</a>
);
export default BrowserLink;
