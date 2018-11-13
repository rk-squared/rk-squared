import * as React from 'react';
import { connect } from 'react-redux';

import { ProxyStatus } from '../actions/proxy';
import { IState } from '../reducers';
import { CollapsibleLink } from './common/CollapsibleLink';
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
              <li>Server: <ProxyServer proxy={proxy}/></li>
              <li>Port: <ProxyPort proxy={proxy}/></li>
            </ul>
          </li>
          <li>Tap &ldquo;Save.&rdquo;</li>
        </ol>

        <h6>Install the RK&sup2; certificate</h6>
        <ol>
          <li>
            Open Safari on your phone or tablet and navigate to <code>rk-squared.com/cert</code>.
            (This <code>cert</code> page isn't a &ldquo;real&rdquo; web page;
            it's handled within RK&sup2; and is only accessible if you've
            configured your proxy.)
          </li>
          <li>
            You should see a message similar to the following:
            {/* Hack: ul/li is bad semantics, but it looks nice enough with the other <ul>s. */}
            <ul>
              <li>
                This website is trying to open Settings to show you a configuration
                profile. Do you want to allow this?
              </li>
            </ul>
            Tap &ldquo;Allow.&rdquo;
          </li>
          <li>
            An &ldquo;Install Profile&rdquo; screen should pop up.  Follow
            the on-screen prompts to install the profile.
          </li>
          <li>
            Go under Settings, under General, under About, under Certificate Trust
            Settings.
          </li>
          <li>
            Under &ldquo;Enable Full Trust for Root Certificates,&rdquo; make sure
            that &ldquo;RK Squared&rdquo; is selected.
          </li>
          <li>
            If you ever want to remove this certificate, you can do so by going
            under Settings, under General, under Profiles &amp; Device Management.
          </li>
        </ol>

        <h6>Restart FFRK</h6>
        <p>If FFRK is currently running, close and restart it.</p>
      </CollapsibleLink>
    );
  }
}

export default connect(
  (state: IState) => ({
    proxy: state.proxy
  })
)(IosInstructions);
