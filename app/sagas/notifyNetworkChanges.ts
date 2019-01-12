import { put, take, takeEvery } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { showMessage } from '../actions/messages';
import { ProxyAction, updateProxyStatus } from '../actions/proxy';

const isIpChange = (action: ProxyAction) =>
  action.type === getType(updateProxyStatus) && !!action.payload.ipAddress;

export function* doNotifyNetworkChanges(action: ReturnType<typeof updateProxyStatus>) {
  const { ipAddress, port } = action.payload;
  if (!ipAddress) {
    return;
  }

  let where = ipAddress.join(', ');
  if (port) {
    where += ` port ${port}`;
  }
  yield put(
    showMessage({
      id: 'notifyNetworkChanges',
      text:
        `Your network configuration has changed. RK² is now running at ${where}. ` +
        "Please update your devices' proxy settings if needed.",
      color: 'info',
    }),
  );
}

export function* notifyNetworkChanges() {
  // Hack: Discard the initial notification from startup.
  yield take(isIpChange);

  yield takeEvery(isIpChange, doNotifyNetworkChanges);
}
