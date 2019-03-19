import * as React from 'react';

import { ProxyStatus } from '../../actions/proxy';

export const ProxyServer = ({ proxy }: { proxy: ProxyStatus }) => (
  <>
    {(proxy.ipAddress || []).map((ip, i) => (
      <span key={i}>
        {i === 0 ? '' : 'or '}
        <strong>{ip}</strong>
      </span>
    ))}
  </>
);

export const ProxyPort = ({ proxy }: { proxy: ProxyStatus }) => <strong>{proxy.port || ''}</strong>;

export const ProxyBypass = () => <strong>127.0.0.1</strong>;
