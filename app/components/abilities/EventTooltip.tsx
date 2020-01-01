import * as React from 'react';

import * as ReactTooltip from 'react-tooltip';

import * as _ from 'lodash';

import { WorldCategory } from '../../actions/worlds';
import { LangContext } from '../../contexts/LangContext';
import { enlir } from '../../data/enlir';
import { getEventText } from '../../data/futureAbilities';
import { localIcons } from '../../data/localData';
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

  getEventText(eventName: string): string {
    const prefix = this.props.description ? this.props.description + ' ' : '';
    return prefix + getEventText(eventName);
  }

  getContent = (eventName: string) => {
    if (!eventName) {
      return null;
    }

    const event = enlir.events[eventName];

    const text = this.getEventText(eventName);
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
