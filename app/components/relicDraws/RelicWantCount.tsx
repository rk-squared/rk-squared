import * as React from 'react';

import { pluralize } from '../../utils/textUtils';

interface Props {
  featuredCount: number | null;
  count: number;
}

export const RelicWantCount = ({ featuredCount, count }: Props) => {
  if (featuredCount && featuredCount !== count) {
    const title = `${featuredCount} featured ${pluralize(featuredCount, 'relic')} and ${count -
      featuredCount} off-banner relics are selected.`;
    if (featuredCount === 1) {
      return <abbr title={title}>1 selected relic</abbr>;
    } else {
      return (
        <>
          ≥1 of <abbr title={title}>{`${featuredCount}+${count - featuredCount}`}</abbr>
          {' selected relics '}
        </>
      );
    }
  } else if (count === 1) {
    return <span>1 selected relic</span>;
  } else {
    return <span>≥1 of {count} selected relics</span>;
  }
};
