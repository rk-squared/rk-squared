import * as React from 'react';
import { Route, RouteComponentProps } from 'react-router';
import { NavLink } from 'react-router-dom';

import { RecordMateriaDetail } from '../actions/recordMateria';
import { AttackReplacement } from '../components/recordMateria/AttackReplacement';
import { DamageHealing } from '../components/recordMateria/DamageHealing';
import { Misc } from '../components/recordMateria/Misc';
import { RecordMateriaGrid } from '../components/recordMateria/RecordMateriaGrid';
import { StatBuffs } from '../components/recordMateria/StatBuffs';

const styles = require('./RecordMateriaRoutes.scss');

interface Props {
  recordMateria: RecordMateriaDetail[];
}

export class RecordMateriaRoutes extends React.Component<Props & RouteComponentProps<Props>> {
  renderAll = () => <RecordMateriaGrid recordMateria={this.props.recordMateria}/>;
  renderStatBuffs = () => <StatBuffs recordMateria={this.props.recordMateria}/>;
  renderDamageHealing = () => <DamageHealing recordMateria={this.props.recordMateria}/>;
  renderAttackReplacement = () => <AttackReplacement recordMateria={this.props.recordMateria}/>;
  renderMisc = () => <Misc recordMateria={this.props.recordMateria}/>;

  render() {
    const { match } = this.props;

    const items: Array<[string, string, () => React.ReactNode]> = [
      ['All', '', this.renderAll],
      ['Stat Buffs', '/statBuffs', this.renderStatBuffs],
      ['Damage / Healing', '/damageHealing', this.renderDamageHealing],
      ['Atk. Replacement', '/attackReplacement', this.renderAttackReplacement],
      ['Misc.', '/misc', this.renderMisc],
    ];

    return (
      <div className={styles.component}>
        <ul className="nav nav-tabs">
          {items.map(([text, subUrl, render], index) =>
            <li className="nav-item" key={index}>
              <NavLink exact className="nav-link" activeClassName="active" to={match.url + subUrl}>{text}</NavLink>
            </li>
          )}
        </ul>

        {items.map(([text, subUrl, render], index) =>
          <Route exact key={index} path={match.url + subUrl} render={render}/>
        )}
      </div>
    );
  }
}
