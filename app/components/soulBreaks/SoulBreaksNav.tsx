import * as React from 'react';
import { HashLink } from 'react-router-hash-link';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as classNames from 'classnames';

import { alphabet } from '../../utils/textUtils';
import { partitionArray } from '../../utils/typeUtils';
import SoulBreaksNavPrefsMenu from './SoulBreaksNavPrefsMenu';

interface Props {
  isAnonymous?: boolean;
  soulBreakAnchor: (letter: string) => string;

  showSearch?: boolean;
  onShowSearch?: (show: boolean) => void;
  onSetSearchFilter?: (search: string) => void;
}

const alphabetParts = partitionArray(alphabet, 4);

export class SoulBreaksNav extends React.PureComponent<Props> {
  handleClickSearch = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (this.props.showSearch != null && this.props.onShowSearch) {
      this.props.onShowSearch(!this.props.showSearch);
    }
  };

  handleSearchKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (this.props.onSetSearchFilter) {
      this.props.onSetSearchFilter((e.target as HTMLInputElement).value);
    }
  };

  renderSearchIcon() {
    const { onShowSearch } = this.props;
    if (!onShowSearch) {
      return null;
    }
    return (
      <li className="nav-item ml-auto">
        <a className="nav-link" href="#" onClick={this.handleClickSearch}>
          <FontAwesomeIcon icon="search" aria-label="Search" />
        </a>
      </li>
    );
  }

  render() {
    const { isAnonymous, soulBreakAnchor, showSearch } = this.props;
    return (
      <div className="sticky-top">
        <nav
          className={classNames('navbar navbar-expand navbar-light bg-light', {
            'pb-1': showSearch,
          })}
        >
          <div className="collapse navbar-collapse" role="navigation">
            {/* Switch to dropdowns at lg - which is actually a bit too small, */}
            {/* esp. if side ads are present... */}
            <ul className="navbar-nav d-none d-lg-flex w-100">
              {alphabet.map((letter, i) => (
                <li className="nav-item" key={i}>
                  <HashLink className="nav-link" to={'#' + soulBreakAnchor(letter)}>
                    {letter}
                  </HashLink>
                </li>
              ))}
              {this.renderSearchIcon()}
              <SoulBreaksNavPrefsMenu isAnonymous={isAnonymous} />
            </ul>
            <ul className="navbar-nav d-lg-none w-100">
              {alphabetParts.map((letters, i) => (
                <li className="nav-item dropdown" key={i}>
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id={`soulBreaksDropdown${i}`}
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    {letters[0]}-{letters[letters.length - 1]}
                  </a>
                  <div className="dropdown-menu" aria-labelledby={`soulBreaksDropdown${i}`}>
                    {letters.map((letter, j) => (
                      <HashLink
                        className="dropdown-item"
                        to={'#' + soulBreakAnchor(letter)}
                        key={j}
                      >
                        {letter}
                      </HashLink>
                    ))}
                  </div>
                </li>
              ))}
              {this.renderSearchIcon()}
              <SoulBreaksNavPrefsMenu isAnonymous={isAnonymous} />
            </ul>
          </div>
        </nav>
        {showSearch && (
          <div className="navbar bg-light form-inline pt-1">
            <input
              className="form-control w-100"
              placeholder="Search"
              onKeyUp={this.handleSearchKeyUp}
            />
          </div>
        )}
      </div>
    );
  }
}
