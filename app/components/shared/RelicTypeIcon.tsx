import * as React from 'react';

import { EnlirRelicType } from '../../data/enlir';
import { equipmentIcons } from '../../data/localData';

interface Props {
  type: EnlirRelicType;
  className?: string;
  style?: React.CSSProperties;
}

export const RelicTypeIcon = ({ type, ...props }: Props) => {
  if (equipmentIcons[type]) {
    return <img {...props} src={equipmentIcons[type]} title={type} />;
  } else {
    // Handle, e.g., Keyblade - as of 3/24, we don't have the icon for that.
    return <span {...props} title={type} />;
  }
};
