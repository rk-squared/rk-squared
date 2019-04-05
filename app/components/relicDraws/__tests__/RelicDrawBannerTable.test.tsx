import * as React from 'react';
import * as renderer from 'react-test-renderer';

import * as _ from 'lodash';

import { RelicDrawBannerTable } from '../RelicDrawBannerTable';

function makeProbabilities(
  relics: number[],
  getProbability?: (id: number, index: number) => number,
) {
  const probabilityFn = getProbability || _.constant(1);
  return {
    // These rarities were taken from the Light Reborn banner during 4A festival.
    byRarity: {
      3: 60.96,
      4: 25,
      5: 8.01999,
      6: 6.01999,
    },
    byRelic: _.fromPairs(relics.map((id, index) => [id, probabilityFn(id, index)])),
  };
}

describe('RelicDrawBannerTable', () => {
  const lightRebornBanner1 = [
    21004035,
    21008209,
    21010068,
    21008231,
    21001136,
    22053274,
    22056183,
    22055051,
    22056216,
    21009074,
    21006060,
    22053364,
    22050094,
    22051121,
  ];

  it('renders featured relics without probabilities', () => {
    const tree = renderer
      .create(<RelicDrawBannerTable title="Featured Relics" relics={lightRebornBanner1} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders featured relics with equal probabilities', () => {
    const tree = renderer
      .create(
        <RelicDrawBannerTable
          title="Featured Relics"
          relics={lightRebornBanner1}
          probabilities={makeProbabilities(lightRebornBanner1)}
        />,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders featured relics with varying probabilities', () => {
    const tree = renderer
      .create(
        <RelicDrawBannerTable
          title="Featured Relics"
          relics={lightRebornBanner1}
          probabilities={makeProbabilities(lightRebornBanner1, (id, index) => index)}
        />,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
