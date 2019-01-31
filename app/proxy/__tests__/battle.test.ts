import { convertBattleDropItems } from '../battle';

import { LangType } from '../../api/apiUrls';

const magiciteBattleData = require('./data/magicite_battle_init_data.json');

describe('battle proxy handler', () => {
  it('reports magicite drops', () => {
    const items = convertBattleDropItems(LangType.Gl, magiciteBattleData.data);
    expect(items).toEqual([
      {
        amount: 1,
        imageUrl:
          'http://ffrk.denagames.com/dff/static/lang/ww/compile/en/image/beast/161000071/161000071_112.png',
        itemId: 161000071,
        name: 'Ixion',
        rarity: 3,
        type: 41,
      },
    ]);
  });
});
