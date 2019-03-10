import * as React from 'react';
import { NavLink } from 'react-router-dom';

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

            <div className="collapse navbar-collapse">
              <ul className="navbar-nav mr-auto flex-column">
                <li className="nav-item">
                  <NavLink className="nav-link" activeClassName="active" to="/dropTracker">
                    Drops
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" activeClassName="active" to="/dungeons">
                    Dungeons
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" activeClassName="active" to="/dungeonScores">
                    Scores
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" activeClassName="active" to="/recordMateria">
                    Record Materia
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" activeClassName="active" to="/soulBreaks">
                    Soul Breaks
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" activeClassName="active" to="/options">
                    Options
                  </NavLink>
                </li>
              </ul>
            </div>
          </nav>

          <div className={`col ${styles.content}`}>{this.props.children}</div>
        </div>
      </div>
    );
  }
}
