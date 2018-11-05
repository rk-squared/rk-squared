import * as React from 'react';

import AndroidInstructions from './AndroidInstructions';
import IosInstructions from './IosInstructions';
import ProxyStatusDisplay from './ProxyStatusDisplay';

export class Home extends React.Component {
  render() {
    return (
      <div>
        <p>
          RK&sup2; runs as a <em>proxy</em>, which means that you need to configure your
          phone or tablet to send its Internet traffic through RK&sup2;.
        </p>

        <p>
          Depending on which mobile device you're using, you may also need to install a
          <em>certificate</em> to let RK&sup2; impersonate the FFRK servers.
        </p>

        <p>
          Once this is done, it can automatically track and help you manage your game progress.
        </p>

        <ProxyStatusDisplay/>
        <AndroidInstructions/>
        <IosInstructions/>
      </div>
    );
  }
}
