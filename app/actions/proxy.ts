import { createAction } from 'typesafe-actions';

export interface ProxyStatus {
  ipAddress?: string[];
  port?: number;
  lastTraffic?: number;
  capturePath?: string;
  logFilename?: string;
}

export const updateProxyStatus = createAction(
  'UPDATE_PROXY_STATUS',
  (status: Partial<ProxyStatus>) => ({
    type: 'UPDATE_PROXY_STATUS',
    payload: status,
  }),
);

export const updateLastTraffic = () => updateProxyStatus({ lastTraffic: Date.now() / 1000 });

export type ProxyAction = ReturnType<typeof updateProxyStatus>;
