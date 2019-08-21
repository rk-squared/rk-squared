import { put, select, take, takeEvery } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { showMessage } from '../actions/messages';
import { Options } from '../actions/options';
import { ProxyAction, updateProxyStatus } from '../actions/proxy';
import { IState } from '../reducers';

const isIpChange = (action: ProxyAction) =>
  action.type === getType(updateProxyStatus) && !!action.payload.ipAddress;

export function* doNotifyNetworkChanges(action: ReturnType<typeof updateProxyStatus>) {
  const { ipAddress, port } = action.payload;
  if (!ipAddress) {
    return;
  }

  const { enableTransparentProxy } = yield select((state: IState) => state.options) as Options;

  let where = ipAddress.join(', ');
  if (port) {
    where += ` port ${port}`;
  }
  const andHosts = enableTransparentProxy ? " and/or computer's hosts file" : '';
  yield put(
    showMessage({
      id: 'notifyNetworkChanges',
      text:
        `Your network configuration has changed. RK² is now running at ${where}. ` +
        `Please update your mobile device's proxy settings${andHosts} if needed.`,
      color: 'info',
    }),
  );
}

export function* notifyNetworkChanges() {
  // Hack: Discard the initial notification from startup.
  yield take(isIpChange);

  yield takeEvery(isIpChange, doNotifyNetworkChanges);
}
