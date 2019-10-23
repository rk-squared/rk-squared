import * as React from 'react';

import * as ReactTooltip from 'react-tooltip';

import * as _ from 'lodash';

import { WorldCategory } from '../../actions/worlds';
import { LangContext } from '../../contexts/LangContext';
import { enlir, EnlirEvent } from '../../data/enlir';
import { localIcons } from '../../data/localData';
import { andJoin } from '../../utils/textUtils';
import { categoryImages } from '../dungeons/DungeonCategoryTitle';
import { SeriesIcon } from '../shared/SeriesIcon';

const styles = require('./EventTooltip.scss');

interface Props {
  id: string;
  description?: string;
}

export class EventTooltip extends React.Component<Props> {
  // noinspection JSUnusedGlobalSymbols
  static contextType = LangContext;
  context!: React.ContextType<typeof LangContext>;

  getEventText(eventName: string, event: EnlirEvent | undefined): string {
    let result = this.props.description ? this.props.description + ' ' : '';
    if (event && event.type === 'Festival' && !event.glDate) {
      result += "JP's " + eventName;
    } else {
      result += eventName;
    }
    if (event && event.realm) {
      result += ` (${event.realm})`;
    }
    if (event && event.heroRecords) {
      result += ', with ' + andJoin(event.heroRecords, true);
    }
    return result;
  }

  getContent = (eventName: string) => {
    if (!eventName) {
      return null;
    }

    const event = enlir.events[eventName];

    const text = this.getEventText(eventName, event);
    let icon: string | null | undefined = null;
    if (eventName.startsWith('Fat Black Chocobo')) {
      icon = localIcons['fatBlackChocobo'];
    } else if (event && event.type === 'Festival') {
      icon = categoryImages[WorldCategory.SpecialEvent];
    }

    return (
      <>
        {event && event.realm && <SeriesIcon realm={event.realm} className={styles.iconsBlock} />}
        {icon && (
          <div className={styles.iconsBlock}>
            <img src={icon} alt="" />
          </div>
        )}
        <div className={styles.textBlock}>{text}</div>
      </>
    );
  };

  render() {
    const { id } = this.props;
    return <ReactTooltip id={id} className={styles.component} getContent={this.getContent} />;
  }
}
