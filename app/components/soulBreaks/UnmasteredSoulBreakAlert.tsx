import * as React from 'react';
import { connect } from 'react-redux';

import classNames from 'classnames';
import * as _ from 'lodash';

import { ExpMap } from '../../actions/characters';
import { IState } from '../../reducers';
import { getUnmasteredLegendMateria, getUnmasteredSoulBreaks } from '../../selectors/characters';
import { pluralize } from '../../utils/textUtils';
import { UnmasteredLegendMateria, UnmasteredSoulBreak } from './UnmasteredItem';

const styles = require('./UnmasteredSoulBreakAlert.scss');

interface Props {
  soulBreaks: ExpMap | undefined;
  legendMateria: ExpMap | undefined;
  className?: string;
}

export class UnmasteredSoulBreakAlert extends React.Component<Props> {
  render() {
    let { soulBreaks, legendMateria } = this.props;
    soulBreaks = soulBreaks || {};
    legendMateria = legendMateria || {};

    const soulBreaksCount = _.size(soulBreaks);
    const legendMateriaCount = _.size(legendMateria);
    const count = soulBreaksCount + legendMateriaCount;

    if (count === 0) {
      return null;
    }

    const caption =
      soulBreaksCount && legendMateriaCount
        ? 'soul breaks and legend materia'
        : soulBreaksCount
        ? pluralize(soulBreaksCount, 'soul break')
        : pluralize(legendMateriaCount, 'legend materia', 'legend materia');

    return (
      <div className={classNames('alert alert-warning', this.props.className)}>
        You have {count} {caption} that {pluralize(count, 'has', 'have')} not yet been mastered:
        <ul className={styles.list}>
          {_.map(soulBreaks, (exp, id) => (
            <UnmasteredSoulBreak id={+id} exp={exp} key={id} />
          ))}
          {_.map(legendMateria, (exp, id) => (
            <UnmasteredLegendMateria id={+id} exp={exp} key={id} />
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
