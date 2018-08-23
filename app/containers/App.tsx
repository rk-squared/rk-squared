import * as React from 'react';
import { Link } from 'react-router-dom';

const styles = require('./App.scss');
const logo = require('../images/logo.png');

export class App extends React.Component {
  render() {
    return (
      <div className={`container-fluid ${styles.component}`}>
        <div className="row">
          <nav className={`col-auto navbar navbar-expand-sm navbar-light bg-light ${styles.nav}`}>
            <Link className="navbar-brand" to="/">
              <img src={logo} alt="RK²" className={styles.logo}/>
            </Link>

            <div className="collapse navbar-collapse">
              <ul className="navbar-nav mr-auto flex-column">
                <li className="nav-item">
                  <Link className="nav-link" to="/dropTracker">Drops</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/dungeons">Dungeons</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/recordMateria">Record Materia</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/options">Options</Link>
                </li>
              </ul>
            </div>
          </nav>

          <div className={`col ${styles.content}`}>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}
