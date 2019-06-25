import * as React from 'react';

import classNames from 'classnames';
import * as _ from 'lodash';

import { EnlirSoulBreak } from '../../data/enlir';
import { describeEnlirSoulBreak, formatMrP, MrPSoulBreak } from '../../data/mrP';
import {
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

  renderSynchroCommands(mrP: MrPSoulBreak, synchroCommands: MrPSoulBreak[]) {
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
      mrPSoulBreaks[soulBreak.id] = describeEnlirSoulBreak(soulBreak);
    }
    const mrP = mrPSoulBreaks[soulBreak.id];

    const name = soulBreak.gl ? soulBreak.name : '“' + soulBreak.name + '”';
    const text = formatMrP(mrP);

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
          <td className={styles.name}>{name}</td>
          <td>{text || '???'}</td>
        </tr>
        {mrP.braveCommands && this.renderBraveCommands(mrP, mrP.braveCommands)}
        {mrP.burstCommands && this.renderBurstCommands(mrP.burstCommands)}
        {mrP.synchroCommands && this.renderSynchroCommands(mrP, mrP.synchroCommands)}
      </>
    );
  }
}
