import * as React from 'react';
import { connect } from 'react-redux';

import { ProxyStatus } from '../../actions/proxy';
import { IState } from '../../reducers';
import { CollapsibleLink } from '../common/CollapsibleLink';
import { ProxyPort, ProxyServer } from './ProxyInstructions';

interface Props {
  proxy: ProxyStatus;
}

export class IosInstructions extends React.Component<Props> {
  render() {
    const { proxy } = this.props;
    return (
      <CollapsibleLink id="ios" title="Instructions for iOS">
        <h6>Configure your proxy</h6>
        <ol>
          <li>Go under Settings, under Wi-Fi.</li>
          <li>Tap on your currently active Wi-Fi network.</li>
          <li>Under &ldquo;HTTP Proxy,&rdquo; tap &ldquo;Configure Proxy.&rdquo;</li>
          <li>Tap &ldquo;Manual.&rdquo;</li>
          <li>
            Enter the following information:
            <ul>
              <li>
                Server: <ProxyServer proxy={proxy} />
              </li>
              <li>
                Port: <ProxyPort proxy={proxy} />
              </li>
            </ul>
          </li>
          <li>Tap &ldquo;Save.&rdquo;</li>
        </ol>

        <h6>Install and enable the RK&sup2; certificate</h6>
        <ol>
          <li>
            Download the certificate.
            <ul>
              <li>
                Open Safari on your phone or tablet and navigate to <code>rk-squared.com/cert</code>
                . (This <code>cert</code> page isn't a &ldquo;real&rdquo; web page; it's handled
                within RK&sup2; and is only accessible if you've configured your proxy.)
              </li>
              <li>
                You should see a message similar to the following:
                <blockquote className="simple-blockquote mb-0">
                  This website is trying to download a configuration profile. Do you want to allow
                  this?
                </blockquote>
                Tap &ldquo;Allow.&rdquo;
              </li>
              <li>
                You should see a message: &ldquo;Profile Downloaded. Review the profile in Settings
                app if you want to install it.&rdquo; Tap &ldquo;Close.&rdquo;
              </li>
            </ul>
          </li>
          <li>
            Install the certificate.
            <ul>
              <li>Go under Settings, under General, under Profiles.</li>
              <li>Tap &rdquo;RK Squared&rdquo;</li>
              <li>Tap &rdquo;Install&rdquo; at the top right corner of the screen.</li>
              <li>
                Follow the on-screen instructions and enter your passcode when prompted to finish
                installing the profile.
              </li>
            </ul>
          </li>
          <li>
            Configure your device to trust the certificate.
            <ul>
              <li>
                Go under Settings, under General, under About, under Certificate Trust Settings.
              </li>
              <li>
                Under &ldquo;Enable Full Trust for Root Certificates,&rdquo; make sure that
                &ldquo;RK Squared&rdquo; is selected.
              </li>
            </ul>
          </li>
          <li>
            The key for this certificate is stored locally on this computer. If you ever run
            RK&sup2; on a different computer or under a different device on this computer, you'll
            need to repeat these steps.
          </li>
          <li>
            If you ever want to remove this certificate, you can do so by going under Settings,
            under General, under Profiles &amp; Device Management.
          </li>
        </ol>

        <h6>Restart FFRK</h6>
        <p>If FFRK is currently running, close and restart it.</p>
      </CollapsibleLink>
    );
  }
}

export default connect((state: IState) => ({
  proxy: state.proxy,
}))(IosInstructions);
