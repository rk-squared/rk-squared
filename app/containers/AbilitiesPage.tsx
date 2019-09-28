import * as React from 'react';
import { Redirect, Route, RouteComponentProps } from 'react-router';
import { NavLink } from 'react-router-dom';

import * as _ from 'lodash';

import { AbilitiesList } from '../components/abilities/AbilitiesList';
import { MAX_ABILITY_RARITY } from '../data/enlir';
import { joinUrl } from '../utils/textUtils';
import { Page } from './Page';

const styles = require('./AbilitiesPage.scss');

function AbilitiesTab({ match }: RouteComponentProps<{ rarity: string }>) {
  const rarity = +match.params.rarity;
  return <AbilitiesList rarity={rarity} key={rarity} />;
}

function RecordBoardAbilitiesTab() {
  return (
    <>
      <div className="alert alert-secondary">
        The Record Board is a new feature added for 5th Anniversary (September 2019 for JP, March
        2020 for GL). It allows you to unlock various character-specific bonuses, including new
        character-specific abilities.
      </div>
      <AbilitiesList rarity={6} showRecordBoard={true} key={'6RB'} />
    </>
  );
}

export class AbilitiesPage extends React.PureComponent<RouteComponentProps> {
  redirect = () => <Redirect to={joinUrl(this.props.match.url, MAX_ABILITY_RARITY.toString())} />;

  render() {
    const { match } = this.props;

    const rarities = _.times(MAX_ABILITY_RARITY, i => MAX_ABILITY_RARITY - i);
    return (
      <Page title="Abilities" className={styles.component}>
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <NavLink
              exact
              className="nav-link"
              activeClassName="active"
              to={joinUrl(match.url, 'recordBoard')}
            >
              Record Board
            </NavLink>
          </li>
          {rarities.map(i => (
            <li className="nav-item" key={i}>
              <NavLink
                exact
                className="nav-link"
                activeClassName="active"
                to={joinUrl(match.url, i.toString())}
              >
                {i}⭑<span className={styles.abilities}> Abilities</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <Route exact path={match.path} render={this.redirect} />
        <Route exact path={joinUrl(match.path, 'recordBoard')} render={RecordBoardAbilitiesTab} />
        <Route exact path={joinUrl(match.path, ':rarity(\\d+)')} render={AbilitiesTab} />
      </Page>
    );
  }
}

export default AbilitiesPage;
