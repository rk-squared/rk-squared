import * as React from 'react';

import classNames from 'classnames';
import * as _ from 'lodash';

import { EnlirLegendMateria } from '../../data/enlir';
import { describeMrPLegendMateria } from '../../data/mrP/legendMateria';
import { legendMateriaAliases, styles } from '../shared/SoulBreakShared';

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

    const name = gl ? legendMateria.name : '“' + legendMateria.name + '”';
    const alias = legendMateriaAliases[id];
    const fullClassName = classNames(className, styles.legendMateria, {
      [styles.jp]: !gl,
    });
    return (
      <tr className={fullClassName}>
        <td className={styles.tier}>
          <span className={styles.legendMateriaTier}>{alias}</span>
        </td>
        <td className={styles.name}>{name}</td>
        <td className={styles.effects}>{mrP || '???'}</td>
      </tr>
    );
  }
}
