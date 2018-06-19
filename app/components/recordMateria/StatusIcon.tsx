import * as React from 'react';
const { default: FontAwesomeIcon } = require('@fortawesome/react-fontawesome');

import { RecordMateriaStatus } from '../../actions/recordMateria';

export class StatusIcon extends React.Component<{status: RecordMateriaStatus}> {
  render() {
    const { status } = this.props;
    switch (status) {
      case RecordMateriaStatus.Unobtained:
        return <FontAwesomeIcon icon="question"/>;
      case RecordMateriaStatus.LockedLowLevel:
        return <FontAwesomeIcon icon="arrow-down"/>;
      case RecordMateriaStatus.LockedMissingPrereq:
        return <FontAwesomeIcon icon="ellipsis-h"/>;
      case RecordMateriaStatus.Unlocked:
        return <FontAwesomeIcon icon="lock-open"/>;
      case RecordMateriaStatus.Collected:
        return <FontAwesomeIcon icon="check"/>;
      case RecordMateriaStatus.Favorite:
        return <FontAwesomeIcon icon="star"/>;
      case RecordMateriaStatus.Vault:
        return <FontAwesomeIcon icon="archive"/>;
    }
  }
}
