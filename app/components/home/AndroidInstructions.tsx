import * as React from 'react';
import { connect } from 'react-redux';

import { ProxyStatus } from '../../actions/proxy';
import { IState } from '../../reducers';
import { CollapsibleLink } from '../common/CollapsibleLink';
import { ProxyBypass, ProxyPort, ProxyServer } from './ProxyInstructions';

interface Props {
  proxy: ProxyStatus;
}

export class AndroidInstructions extends React.Component<Props> {
  render() {
    const { proxy } = this.props;
    return (
      <CollapsibleLink id="android" title="Instructions for Android">
        <ol>
          <li>
            Swipe down from the top of the screen to show your notifications and quick settings.
          </li>
          <li>Long-press on Wi-Fi to go to Wi-Fi settings.</li>
          <li>
            Long-press on your active Wi-Fi connection and choose &ldquo;Manage network
            settings.&rdquo;
          </li>
          <li>Change &ldquo;Proxy&rdquo; to &ldquo;Manual.&rdquo;</li>
          <li>
            Enter the following information:
            <ul>
              <li>
                Proxy host name: <ProxyServer proxy={proxy} />
              </li>
              <li>
                Proxy port: <ProxyPort proxy={proxy} />
              </li>
              <li>
                Bypass proxy for: <ProxyBypass />
              </li>
            </ul>
          </li>
          <li>Tap &ldquo;Save.&rdquo;</li>
          <li>If FFRK is currently running, close and restart it.</li>
        </ol>
      </CollapsibleLink>
    );
  }
}

export default connect((state: IState) => ({
  proxy: state.proxy,
}))(AndroidInstructions);
