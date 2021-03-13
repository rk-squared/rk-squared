import * as React from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'timeago-react';

import { ProxyStatus } from '../../actions/proxy';
import { IState } from '../../reducers';

interface Props {
  proxy: ProxyStatus;
}

export class ProxyStatusDisplay extends React.Component<Props> {
  render() {
    const { ipAddress, port, lastTraffic } = this.props.proxy;
    return (
      <div>
        <h5>Current status</h5>
        {ipAddress && port ? (
          <p>
            RK&sup2; is running at {ipAddress.join(', ')} port {port}.
          </p>
        ) : (
          <p>RK&sup2; is not running.</p>
        )}
        {lastTraffic ? (
          <p>
            Connected; last seen <TimeAgo datetime={lastTraffic * 1000} />.
          </p>
        ) : (
          <p>Waiting for connection.</p>
        )}
      </div>
    );
  }
}

export default connect((state: IState) => ({
  proxy: state.proxy,
}))(ProxyStatusDisplay);
