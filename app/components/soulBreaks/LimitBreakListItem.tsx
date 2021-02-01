import * as React from 'react';

import classNames from 'classnames';

import { EnlirLimitBreak } from '../../data/enlir';
import { convertEnlirSkillToMrP, formatMrPSkill, MrPSkill } from '../../data/mrP/skill';
import {
  formatSoulBreakOrLegendMateriaName,
  getGuardianColumns,
  limitBreakAbbrevAliases,
  styles,
  tierClass,
} from '../shared/SoulBreakShared';

interface Props {
  limitBreak: EnlirLimitBreak;
  className?: string;
}

const mrPLimitBreaks: { [id: number]: MrPSkill } = {};

export class LimitBreakListItem extends React.PureComponent<Props> {
  renderGuardianCommands(mrP: MrPSkill, guardianCommands: MrPSkill[]) {
    return (
      <>
        {getGuardianColumns(mrP, guardianCommands).map((columns, i) => (
          <tr className={classNames(this.props.className, styles.guardianCommand)} key={i}>
            <td />
            <td className={styles.school}>{columns[0]}</td>
            <td className={styles.command}>{columns[1]}</td>
          </tr>
        ))}
      </>
    );
  }

  render() {
    const { limitBreak, className } = this.props;

    if (!mrPLimitBreaks[limitBreak.id]) {
      mrPLimitBreaks[limitBreak.id] = convertEnlirSkillToMrP(limitBreak);
    }
    const mrP = mrPLimitBreaks[limitBreak.id];

    const text = formatMrPSkill(mrP);

    const alias = limitBreakAbbrevAliases[limitBreak.id] || limitBreak.tier;

    const fullClassName = classNames(className, tierClass[limitBreak.tier], {
      [styles.jp]: !limitBreak.gl,
    });
    return (
      <>
        <tr className={fullClassName}>
          <td className={styles.tier}>{alias}</td>
          <td className={styles.name}>{formatSoulBreakOrLegendMateriaName(limitBreak)}</td>
          <td className={styles.effects}>{text || '???'}</td>
        </tr>
        {mrP.guardianCommands && this.renderGuardianCommands(mrP, mrP.guardianCommands)}
      </>
    );
  }
}
