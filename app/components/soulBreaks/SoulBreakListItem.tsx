import * as React from 'react';

import classNames from 'classnames';

import { EnlirSoulBreak } from '../../data/enlir';
import { convertEnlirSkillToMrP, formatMrPSkill, MrPSkill } from '../../data/mrP/skill';
import { breakHyphensAndSlashes } from '../../utils/textUtils';
import {
  formatSoulBreakOrLegendMateriaName,
  getBraveColumns,
  getBurstColumns,
  getSynchroColumns,
  soulBreakAbbrevAliases,
  styles,
  tierClass,
} from '../shared/SoulBreakShared';

interface Props {
  soulBreak: EnlirSoulBreak;
  className?: string;
}

const mrPSoulBreaks: { [id: number]: MrPSkill } = {};

export class SoulBreakListItem extends React.PureComponent<Props> {
  renderBraveCommands(mrP: MrPSkill, braveCommands: MrPSkill[]) {
    const columns = getBraveColumns(mrP, braveCommands);
    return (
      <tr className={classNames(this.props.className, styles.braveCommand)}>
        <td />
        <td>{columns[0]}</td>
        <td className={styles.command}>{columns[1]}</td>
      </tr>
    );
  }

  renderBurstCommands(burstCommands: MrPSkill[]) {
    // As of December 2019, Ward's BSB is the only command with a long enough
    // string of hyphen-separated values that it causes obvious problems for
    // mobile, so we only use breakHyphensAndSlashes here.
    return (
      <>
        {getBurstColumns(burstCommands).map((columns, i) => (
          <tr className={classNames(this.props.className, styles.burstCommand)} key={i}>
            <td />
            <td className={styles.school}>{columns[0]}</td>
            <td className={styles.command}>{breakHyphensAndSlashes(columns[1])}</td>
          </tr>
        ))}
      </>
    );
  }

  renderSynchroCommands(mrP: MrPSkill, synchroCommands: MrPSkill[]) {
    return (
      <>
        {getSynchroColumns(mrP, synchroCommands).map((columns, i) => (
          <tr className={classNames(this.props.className, styles.synchroCommand)} key={i}>
            <td />
            <td className={styles.school}>{columns[0]}</td>
            <td className={styles.command}>{columns[1]}</td>
          </tr>
        ))}
      </>
    );
  }

  render() {
    const { soulBreak, className } = this.props;

    if (!mrPSoulBreaks[soulBreak.id]) {
      mrPSoulBreaks[soulBreak.id] = convertEnlirSkillToMrP(soulBreak);
    }
    const mrP = mrPSoulBreaks[soulBreak.id];

    const text = formatMrPSkill(mrP);

    let alias = soulBreakAbbrevAliases[soulBreak.id] || soulBreak.tier;
    if (alias !== '-') {
      alias = alias.replace('-', '');
    }

    const fullClassName = classNames(className, tierClass[soulBreak.tier], {
      [styles.jp]: !soulBreak.gl,
    });
    return (
      <>
        <tr className={fullClassName}>
          <td className={styles.tier}>{alias}</td>
          <td className={styles.name}>{formatSoulBreakOrLegendMateriaName(soulBreak)}</td>
          <td className={styles.effects}>{text || '???'}</td>
        </tr>
        {mrP.braveCommands && this.renderBraveCommands(mrP, mrP.braveCommands)}
        {mrP.burstCommands && this.renderBurstCommands(mrP.burstCommands)}
        {mrP.synchroCommands && this.renderSynchroCommands(mrP, mrP.synchroCommands)}
      </>
    );
  }
}
