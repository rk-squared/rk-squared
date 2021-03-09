import * as React from 'react';

import { ICellRendererParams } from '@ag-grid-community/core';

import { MagiciteDungeonWithScore } from '../../selectors/dungeonsWithScore';

export const MagiciteNameCellRenderer = ({ value, data }: ICellRendererParams) => {
  const { detail } = data as MagiciteDungeonWithScore;
  let name = value as string;
  if (!name) {
    return null;
  }
  name = name.replace(' Record', '');
  return (
    <>
      {name}
      {detail && <span className="text-muted"> ({detail})</span>}
    </>
  );
};
