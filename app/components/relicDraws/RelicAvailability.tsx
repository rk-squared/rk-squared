import * as React from 'react';

import * as moment from 'moment';

import { animaWaves } from '../../data/anima';
import { EnlirSoulBreakOrLegendMateria } from '../../data/enlir';
import { localIcons } from '../../data/localData';

const styles = require('./RelicAvailability.scss');

interface Props {
  item: EnlirSoulBreakOrLegendMateria;
}

export class RelicAvailability extends React.Component<Props> {
  renderAnima() {
    const { item } = this.props;
    if (!item.anima) {
      return null;
    }
    const wave = animaWaves[item.anima];

    let title = `Anima wave ${item.anima}`;
    if (wave) {
      if (wave.released) {
        title += ' (currently available)';
      } else {
        const when = moment([wave.estimatedYear, wave.estimatedMonth - 1]);
        title += ` (estimated ${when.format('MMMM YYYY')})`;
      }
    }

    const icon = localIcons[`animaWave${item.anima}`] || localIcons.animaUnknown;
    return <img className={styles.anima} src={icon} title={title} />;
  }

  render() {
    return <>{this.renderAnima()}</>;
  }
}
