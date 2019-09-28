import * as React from 'react';

import * as ReactTooltip from 'react-tooltip';

import * as _ from 'lodash';

import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data/enlir';
import { andJoin } from '../../utils/textUtils';

const styles = require('./EventTooltip.scss');

interface Props {
  id: string;
}

export class EventTooltip extends React.Component<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  getContent = (abilityId: string) => {
    if (!abilityId) {
      return null;
    }
    const ability = enlir.abilities[abilityId];
    const event = enlir.events[ability.introducingEvent];
    if (!event) {
      return null;
    }
    let result = 'Released in ';
    if (event.type === 'Festival') {
      result += "JP's " + event.eventName;
    } else {
      result += event.eventName;
    }
    if (event.realm) {
      result += ` (${event.realm})`;
    }
    if (event.heroRecords) {
      result += ', with ' + andJoin(event.heroRecords, true);
    }
    return <div className={styles.releaseDateTooltip}>{result}</div>;
  };

  render() {
    const { id } = this.props;
    return <ReactTooltip id={id} className={styles.component} getContent={this.getContent} />;
  }
}
