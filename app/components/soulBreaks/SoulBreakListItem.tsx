import * as React from 'react';

import classNames from 'classnames';
import * as _ from 'lodash';

import { enlir, EnlirSoulBreak, EnlirSoulBreakTier, makeSoulBreakAliases } from '../../data/enlir';
import { describeEnlirSoulBreak, formatMrP, MrPSoulBreak } from '../../data/mrP';
import { formatBraveCommands } from '../../data/mrP/brave';
import { getSchoolShortName, getShortName } from '../../data/mrP/types';

export const styles = require('./SoulBreakListItem.scss');

export const tierClass: { [tier in EnlirSoulBreakTier]: string | undefined } = {
  SB: styles.unique,
  SSB: styles.super,
  BSB: styles.burst,
  OSB: styles.overstrike,
  AOSB: styles.overstrike,
  USB: styles.ultra,
  CSB: styles.chain,
  AASB: styles.awakening,
  Glint: styles.glint,
  'Glint+': styles.glint,

  // Unused - placeholders
  Default: styles.unique,
  RW: styles.unique,
  Shared: styles.unique,
};

export const soulBreakAliases = makeSoulBreakAliases(enlir.soulBreaks, {
  Default: '-',
  SB: '-',
  SSB: 'S',
  BSB: 'B',
  OSB: 'O',
  AOSB: 'AO',
  Glint: 'G',
  'Glint+': 'G+',
  USB: 'U',
  CSB: 'C',
  AASB: 'AA',
  RW: '-',
  Shared: '-',
});

export function getBraveColumns(
  mrP: MrPSoulBreak,
  braveCommands: MrPSoulBreak[],
): [string, string] {
  return [
    '[' +
      (braveCommands[0].school ? getSchoolShortName(braveCommands[0].school) : '?') +
      '], +1 on ' +
      mrP.braveCondition!.map(getShortName).join('/'),
    formatBraveCommands(braveCommands),
  ];
}

export function getBurstColumns(burstCommands: MrPSoulBreak[]): Array<[string, string]> {
  return burstCommands.map(
    cmd =>
      [
        '[' + (cmd.school ? getSchoolShortName(cmd.school) : '?') + ']',
        '[' + formatMrP(cmd) + ']',
      ] as [string, string],
  );
}

interface Props {
  soulBreak: EnlirSoulBreak;
  className?: string;
}

const mrPSoulBreaks: { [id: number]: MrPSoulBreak } = {};

export class SoulBreakListItem extends React.Component<Props> {
  renderBraveCommands(mrP: MrPSoulBreak, braveCommands: MrPSoulBreak[]) {
    const columns = getBraveColumns(mrP, braveCommands);
    return (
      <tr className={classNames(this.props.className, styles.braveCommand)}>
        <td />
        <td>{columns[0]}</td>
        <td>{columns[1]}</td>
      </tr>
    );
  }

  renderBurstCommands(burstCommands: MrPSoulBreak[]) {
    return (
      <>
        {getBurstColumns(burstCommands).map((columns, i) => (
          <tr className={classNames(this.props.className, styles.burstCommand)} key={i}>
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
      mrPSoulBreaks[soulBreak.id] = describeEnlirSoulBreak(soulBreak);
    }
    const mrP = mrPSoulBreaks[soulBreak.id];

    const name = soulBreak.gl ? soulBreak.name : '“' + soulBreak.name + '”';
    const text = formatMrP(mrP);

    let alias = soulBreakAliases[soulBreak.id] || soulBreak.tier;
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
          <td className={styles.name}>{name}</td>
          <td>{text || '???'}</td>
        </tr>
        {mrP.braveCommands && this.renderBraveCommands(mrP, mrP.braveCommands)}
        {mrP.burstCommands && this.renderBurstCommands(mrP.burstCommands)}
      </>
    );
  }
}
