import * as React from 'react';
import { NavLink } from 'react-router-dom';

import { History } from 'history';

import { GoogleAd250x250 } from '../components/common/GoogleAd250x250';
import { routes } from '../routes';
import { ErrorBoundary } from './ErrorBoundary';

const styles = require('./AppLayout.scss');
const logo = require('../images/logo.png');

interface Props {
  history?: History;
  children: any;
}

export class AppLayout extends React.Component<Props> {
  render() {
    const { history, children } = this.props;
    const navId = 'appNav';
    return (
      <div className={`container-fluid ${styles.component}`}>
        <div className="row">
          <nav
            className={`col-md-auto navbar navbar-expand-sm navbar-light bg-light ${styles.nav}`}
          >
            <NavLink className="navbar-brand" activeClassName="active" to="/">
              <img src={logo} alt="RK²" className={styles.logo} />
            </NavLink>

            <button
              className="navbar-toggler"
              type="button"
              data-toggle="collapse"
              data-target={'#' + navId}
              aria-controls={navId}
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div className={`collapse navbar-collapse`} id={navId}>
              <ul className="navbar-nav mr-auto flex-column">
                {routes
                  .filter(i => i.description != null)
                  .map(({ description, path }, i) => (
                    <li className="nav-item" key={i}>
                      <NavLink className="nav-link" activeClassName="active" to={path}>
                        {description}
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </div>

            {!process.env.IS_ELECTRON && (
              <div className={styles.ad + ' d-none d-md-block'}>
                <GoogleAd250x250 />
              </div>
            )}
          </nav>

          <div className={`col ${styles.content}`}>
            <ErrorBoundary history={history}>{children}</ErrorBoundary>
          </div>
        </div>
      </div>
    );
  }
}
