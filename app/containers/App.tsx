import * as React from 'react';
import { Link } from 'react-router-dom';

export default class App extends React.Component {
  render() {
    return (
      <div className="container">
        <nav className="navbar navbar-expand-sm navbar-light bg-light">
          <Link className="navbar-brand" to="/">RK<sup>2</sup></Link>

          <div className="collapse navbar-collapse">
            <ul className="navbar-nav mr-auto">
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

        <div className="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}
