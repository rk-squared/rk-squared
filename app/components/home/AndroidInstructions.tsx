import * as React from 'react';
import { connect } from 'react-redux';

import { ProxyStatus } from '../../actions/proxy';
import { IState } from '../../reducers';
import { BrowserLink } from '../common/BrowserLink';
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
        <h6>Configure your proxy</h6>
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

        <h6>Install and enable the RK&sup2; certificate</h6>
        <p>
          Current versions of FFRK for Android require that you install the RK&sup2; certificate on
          Android.
        </p>

        <p>There are two ways of getting the certificate:</p>

        <ul>
          <li>
            Open Chrome on your phone, tablet, or emulator and navigate to{' '}
            <code>cert.rk-squared.com</code>. (This <code>cert</code> site isn't a
            &ldquo;real&rdquo; web site; it's handled within RK&sup2; and is only accessible if
            you've configured your proxy.)
          </li>
          <li>
            Go to RK²'s user preferences directory{' '}
            {proxy.capturePath && (
              <span>
                (currently <code>{proxy.capturePath}</code>)
              </span>
            )}{' '}
            and copy <code>ffrk-ca.pem</code>.
          </li>
        </ul>

        <p>
          Instructions for configuring your Android device or emulator to use the certificate are
          available online. See{' '}
          <BrowserLink href="https://www.reddit.com/r/FFRecordKeeper/comments/pl4p84/using_rk_squared_with_android_51_and_ffrk_800/">
            here
          </BrowserLink>{' '}
          for one example.
        </p>
      </CollapsibleLink>
    );
  }
}

export default connect((state: IState) => ({
  proxy: state.proxy,
}))(AndroidInstructions);
