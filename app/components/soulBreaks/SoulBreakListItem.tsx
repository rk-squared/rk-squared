import * as React from 'react';

import classNames from 'classnames';

import { enlir, EnlirSoulBreak, isTrueArcane1st, isTrueArcane2nd } from '../../data/enlir';
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

// Cache parse results for performance
const mrPSoulBreaks = new Map<EnlirSoulBreak, MrPSkill>();

function getMemoizedMrP(soulBreak: EnlirSoulBreak) {
  let mrP = mrPSoulBreaks.get(soulBreak);
  if (!mrP) {
    mrP = convertEnlirSkillToMrP(soulBreak);
    mrPSoulBreaks.set(soulBreak, mrP);
  }
  return mrP;
}

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

  renderTrueArcane2nd(trueArcane2nd: EnlirSoulBreak) {
    const mrP = getMemoizedMrP(trueArcane2nd);
    const text = formatMrPSkill(mrP);
    return (
      <tr className={classNames(this.props.className, styles.trueArcane2nd)}>
        <td />
        <td className={styles.school}>then</td>
        <td>{text || '???'}</td>
      </tr>
    );
  }

  render() {
    let { soulBreak, className } = this.props;

    // To handle TASBs: The second soul break is authoritative (see enlir.ts's
    // enlir data structure for details), so if asked to render the 1st, do,
    // nothing, and if asked to render the 2nd, show 1st and then 2nd.
    let trueArcane2nd: EnlirSoulBreak | undefined;
    if (isTrueArcane1st(soulBreak)) {
      return null;
    }
    if (isTrueArcane2nd(soulBreak)) {
      trueArcane2nd = soulBreak;
      soulBreak = enlir.trueArcane1stSoulBreaks[soulBreak.id];
    }

    const mrP = getMemoizedMrP(soulBreak);
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
        {trueArcane2nd && this.renderTrueArcane2nd(trueArcane2nd)}
      </>
    );
  }
}
