import * as React from 'react';
import { NavLink } from 'react-router-dom';

import { GoogleAd250x250 } from '../components/common/GoogleAd250x250';
import { routes } from '../routes';

const styles = require('./AppLayout.scss');
const logo = require('../images/logo.png');

interface Props {
  children: any;
}

export class AppLayout extends React.Component<Props> {
  render() {
    return (
      <div className={`container-fluid ${styles.component}`}>
        <div className="row">
          <nav className={`col-auto navbar navbar-expand-sm navbar-light bg-light ${styles.nav}`}>
            <NavLink className="navbar-brand" activeClassName="active" to="/">
              <img src={logo} alt="RK²" className={styles.logo} />
            </NavLink>

            <div className={`collapse navbar-collapse`}>
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
              <div className={styles.ad}>
                <GoogleAd250x250 />
              </div>
            )}
          </nav>

          <div className={`col ${styles.content}`}>{this.props.children}</div>
        </div>
      </div>
    );
  }
}
