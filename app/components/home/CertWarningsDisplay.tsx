import * as React from 'react';

import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { IState } from '../../reducers';

interface Props {
  certWarnings?: string[];
}

export class CertWarningsDisplay extends React.Component<Props> {
  render() {
    const { certWarnings } = this.props;
    if (!certWarnings || !certWarnings.length) {
      return null;
    }
    return (
      <div className="alert alert-warning">
        {certWarnings.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
        <p className="mb-0">
          You may be unable to use RK&sup2; with iOS until this is resolved. Please go under the{' '}
          <Link to="/options" className="alert-link">
            Options screen
          </Link>{' '}
          and recreate your certificate.
        </p>
      </div>
    );
  }
}

export default connect((state: IState) => ({
  certWarnings: state.proxy.certWarnings,
}))(CertWarningsDisplay);
