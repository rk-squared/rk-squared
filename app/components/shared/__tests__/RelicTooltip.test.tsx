import * as React from 'react';
import * as renderer from 'react-test-renderer';

import { RelicTooltip } from '../RelicTooltip';

describe('RelicTooltip', () => {
  it('renders an accessory tooltip', () => {
    const tree = renderer.create(<RelicTooltip id="test" relicId={23080334} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders nothing when given an unknown relic', () => {
    const tree = renderer.create(<RelicTooltip id="test" relicId={1} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
