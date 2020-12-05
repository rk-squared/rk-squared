import * as React from 'react';

import classNames from 'classnames';

import { EnlirLegendMateria } from '../../data/enlir';
import { describeMrPLegendMateria } from '../../data/mrP/legendMateria';
import {
  formatSoulBreakOrLegendMateriaName,
  legendMateriaAliases,
  styles,
} from '../shared/SoulBreakShared';

interface Props {
  legendMateria: EnlirLegendMateria;
  className?: string;
}

const mrPLegendMateria: { [id: number]: string } = {};

export class LegendMateriaListItem extends React.PureComponent<Props> {
  render() {
    const { legendMateria, className } = this.props;
    const { id, gl } = legendMateria;

    if (!mrPLegendMateria[id]) {
      mrPLegendMateria[id] = describeMrPLegendMateria(legendMateria) || legendMateria.effect;
    }
    const mrP = mrPLegendMateria[id];

    const alias = legendMateriaAliases[id];
    const fullClassName = classNames(className, styles.legendMateria, {
      [styles.jp]: !gl,
    });
    return (
      <tr className={fullClassName}>
        <td className={styles.tier}>
          <span className={styles.legendMateriaTier}>{alias}</span>
        </td>
        <td className={styles.name}>{formatSoulBreakOrLegendMateriaName(legendMateria)}</td>
        <td className={styles.effects}>{mrP || '???'}</td>
      </tr>
    );
  }
}
