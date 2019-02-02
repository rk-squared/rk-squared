import * as React from 'react';

import { BrowserLink } from './BrowserLink';

export class DonationInfo extends React.Component {
  render() {
    return (
      <div className="alert alert-info">
        Like RK&sup2;? Want to help support its development?{' '}
        <BrowserLink href="#" className="alert-link">
          Buy me a coffee!
        </BrowserLink>
      </div>
    );
  }
}
