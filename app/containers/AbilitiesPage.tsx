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
  return <AbilitiesList rarity={+match.params.rarity} />;
}

export class AbilitiesPage extends React.PureComponent<RouteComponentProps> {
  redirect = () => <Redirect to={joinUrl(this.props.match.url, MAX_ABILITY_RARITY.toString())} />;

  render() {
    const { match } = this.props;

    const rarities = _.times(MAX_ABILITY_RARITY, i => MAX_ABILITY_RARITY - i);
    return (
      <Page title="Abilities" className={styles.component}>
        <ul className="nav nav-tabs">
          {rarities.map(i => (
            <li className="nav-item" key={i}>
              <NavLink
                exact
                className="nav-link"
                activeClassName="active"
                to={joinUrl(match.url, i.toString())}
              >
                {i}⭑ Abilities
              </NavLink>
            </li>
          ))}
        </ul>

        <Route exact path={match.path} render={this.redirect} />
        <Route exact path={joinUrl(match.path, ':rarity(\\d+)')} render={AbilitiesTab} />
      </Page>
    );
  }
}

export default AbilitiesPage;
