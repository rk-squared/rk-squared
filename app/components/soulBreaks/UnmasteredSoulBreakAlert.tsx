import * as React from 'react';
import { connect } from 'react-redux';

import classNames from 'classnames';

import { IState } from '../../reducers';
import { getUnmasteredLegendMateria, getUnmasteredSoulBreaks } from '../../selectors/characters';
import { pluralize } from '../../utils/textUtils';
import { UnmasteredLegendMateria, UnmasteredSoulBreak } from './UnmasteredItem';

const styles = require('./UnmasteredSoulBreakAlert.scss');

interface Props {
  soulBreaks: number[] | undefined;
  legendMateria: number[] | undefined;
  className?: string;
}

export class UnmasteredSoulBreakAlert extends React.Component<Props> {
  render() {
    let { soulBreaks, legendMateria } = this.props;
    soulBreaks = soulBreaks || [];
    legendMateria = legendMateria || [];
    if (!soulBreaks.length && !legendMateria.length) {
      return null;
    }

    const count = soulBreaks.length + legendMateria.length;
    const caption =
      soulBreaks.length && legendMateria.length
        ? 'soul breaks and legend materia'
        : soulBreaks.length
        ? pluralize(soulBreaks.length, 'soul break')
        : pluralize(legendMateria.length, 'legend materia', 'legend materia');

    return (
      <div className={classNames('alert alert-warning', this.props.className)}>
        You have {count} {caption} that {pluralize(count, 'has', 'have')} not yet been mastered:
        <ul className={styles.list}>
          {soulBreaks.map((id, i) => (
            <UnmasteredSoulBreak id={id} key={i} />
          ))}
          {legendMateria.map((id, i) => (
            <UnmasteredLegendMateria id={id} key={i} />
          ))}
        </ul>
      </div>
    );
  }
}

export default connect((state: IState) => ({
  soulBreaks: getUnmasteredSoulBreaks(state),
  legendMateria: getUnmasteredLegendMateria(state),
}))(UnmasteredSoulBreakAlert);
