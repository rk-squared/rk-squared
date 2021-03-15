import * as React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { RecordMateriaStatus } from '../../actions/recordMateria';

const styles = require('./StatusIcon.module.scss');

export class StatusIcon extends React.Component<{ status: RecordMateriaStatus }> {
  render() {
    const { status } = this.props;
    switch (status) {
      case RecordMateriaStatus.Unknown:
        return <FontAwesomeIcon className={styles.unknown} icon="question" fixedWidth />;
      case RecordMateriaStatus.LockedLowLevel:
        return <FontAwesomeIcon className={styles.lockedLowLevel} icon="arrow-down" fixedWidth />;
      case RecordMateriaStatus.LockedMissingPrereq:
        return (
          <FontAwesomeIcon className={styles.lockedMissingPrereq} icon="ellipsis-h" fixedWidth />
        );
      case RecordMateriaStatus.Unlocked:
        return <FontAwesomeIcon className={styles.unlocked} icon="lock-open" fixedWidth />;
      case RecordMateriaStatus.Collected:
        return <FontAwesomeIcon className={styles.collected} icon="check" fixedWidth />;
      case RecordMateriaStatus.Favorite:
        return <FontAwesomeIcon className={styles.favorite} icon="star" fixedWidth />;
      case RecordMateriaStatus.Vault:
        return <FontAwesomeIcon className={styles.vault} icon="archive" fixedWidth />;
    }
  }
}
