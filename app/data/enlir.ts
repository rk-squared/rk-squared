const rawData = {
  abilities: require('./enlir/abilities.json'),
  characters: require('./enlir/characters.json'),
  magicite: require('./enlir/magicite.json'),
  recordMateria: require('./enlir/recordMateria.json'),
  relics: require('./enlir/relics.json'),
};

import * as _ from 'lodash';

// FIXME: Properly update rawData outside of app

export const enlir = {
  abilities: _.keyBy(rawData.abilities, 'id'),
  magicites: _.keyBy(rawData.magicite, 'id'),
  relics: _.keyBy(rawData.relics, 'id'),
  recordMateria: _.keyBy(rawData.recordMateria, 'name'),
};
