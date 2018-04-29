import * as React from 'react';

import AndroidInstructions from './AndroidInstructions';
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
          Once that's done, it can automatically track and help you manage your game progress.
        </p>

        <ProxyStatusDisplay/>
        <AndroidInstructions/>
        <p>iPhone is not currently supported.</p>
      </div>
    );
  }
}
