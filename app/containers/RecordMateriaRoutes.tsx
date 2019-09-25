import * as React from 'react';
import { Route, RouteComponentProps } from 'react-router';
import { NavLink } from 'react-router-dom';

import { AttackReplacement } from '../components/recordMateria/AttackReplacement';
import { DamageHealing } from '../components/recordMateria/DamageHealing';
import { Misc } from '../components/recordMateria/Misc';
import { RecordMateriaGrid } from '../components/recordMateria/RecordMateriaGrid';
import { RecordMateriaProps } from '../components/recordMateria/RecordMateriaList';
import { StatBuffs } from '../components/recordMateria/StatBuffs';
import { joinUrl } from '../utils/textUtils';

const styles = require('./RecordMateriaRoutes.scss');

export class RecordMateriaRoutes extends React.Component<RecordMateriaProps & RouteComponentProps> {
  renderPart = (Part: React.ComponentType<RecordMateriaProps>) => (
    <Part recordMateria={this.props.recordMateria} isAnonymous={this.props.isAnonymous} />
  );
  renderAll = () => this.renderPart(RecordMateriaGrid);
  renderStatBuffs = () => this.renderPart(StatBuffs);
  renderDamageHealing = () => this.renderPart(DamageHealing);
  renderAttackReplacement = () => this.renderPart(AttackReplacement);
  renderMisc = () => this.renderPart(Misc);

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
          {items.map(([text, subUrl, render], index) => (
            <li className="nav-item" key={index}>
              <NavLink
                exact
                className="nav-link"
                activeClassName="active"
                to={joinUrl(match.url, subUrl)}
              >
                {text}
              </NavLink>
            </li>
          ))}
        </ul>

        {items.map(([text, subUrl, render], index) => (
          <Route exact key={index} path={joinUrl(match.path, subUrl)} render={render} />
        ))}
      </div>
    );
  }
}
