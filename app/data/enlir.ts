const rawData = require('./enlir.json');
import * as _ from 'lodash';

const makeLookup = (sheet: any[]) => _.fromPairs(sheet.map(i => [+i.Id, i]));

// FIXME: Properly update rawData outside of app; make available within dist; resolve id vs. EnlirId

const enlir = {
  magicites: makeLookup(rawData.Magicites),
  relics: makeLookup(rawData.Relics),
};

export default enlir;
