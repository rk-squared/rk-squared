import { enlir } from '../enlir';

describe('enlir', () => {
  it('looks up abilities', () => {
    expect(enlir.abilities[30111001].name).toEqual('Fire');
  });
});
