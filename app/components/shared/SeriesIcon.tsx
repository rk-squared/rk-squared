import * as React from 'react';

import * as classNames from 'classnames';

import { LangType } from '../../api/apiUrls';
import { EnlirRealm } from '../../data/enlir';
import { enlirRealmToSeriesId } from '../../data/series';
import { seriesIcon } from '../../data/urls';

const styles = require('./SeriesIcon.module.scss');

interface Props {
  seriesId?: number;
  realm?: EnlirRealm;
  className?: string;
}

/**
 * Shows an icon for a series (realm).  Because FFRK's series icons are large
 * and oddly sized, this needs to include logic to position it as a background
 * image.
 *
 * Note: DungeonCard also includes its own, slightly duplicated, logic to
 * use series icons.
 */
export class SeriesIcon extends React.Component<Props> {
  render() {
    const { realm, className } = this.props;
    let seriesId = this.props.seriesId;
    if (realm) {
      seriesId = enlirRealmToSeriesId[realm];
    }
    if (!seriesId) {
      return null;
    }

    // Series icons don't vary across languages, so use GL for simplicity.
    const icon = seriesIcon(LangType.Gl, seriesId);
    if (!icon) {
      return null;
    }

    return (
      <div className={classNames(className, styles.component)}>
        <div style={{ backgroundImage: `url(${icon})` }} />
      </div>
    );
  }
}
