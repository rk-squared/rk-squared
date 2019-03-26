import * as React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { BrowserLink } from './common/BrowserLink';

const URL = 'https://ko-fi.com/rksquared';

export class DonationInfo extends React.Component {
  render() {
    return (
      <div className="alert alert-info">
        Like RK&sup2;? Want to help support its development?{' '}
        <BrowserLink href={URL} className="alert-link">
          Buy me a coffee!
        </BrowserLink>{' '}
        <FontAwesomeIcon icon="coffee-togo" />
      </div>
    );
  }
}
