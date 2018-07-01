const rawData = require('./enlir.json');
import * as _ from 'lodash';

// Given a set of data from the Enlir JSON, make a lookup by ID.
const makeDataLookup = (sheet: any[]) => _.fromPairs(sheet.map(i => [+i.Id, i]));

// Given a list of Key/Value pairs from the Enlir JSON, make a lookup by ID.
// These lists give IDs that are auto-assigned by the Enlir / FFRK API web service.
const makeTypeLookup = (types: any[]) => _.fromPairs(types.map(i => [+i.Key, i.Value]));

// FIXME: Properly update rawData outside of app; resolve id vs. EnlirId

export const enlir = {
  abilities: makeDataLookup(rawData.Abilities),
  magicites: makeDataLookup(rawData.Magicites),
  relics: makeDataLookup(rawData.Relics),
  recordMateria: _.keyBy(rawData.RecordMaterias, 'RecordMateriaName'),
  types: {
    relics: makeTypeLookup(rawData.RelicTypeList)
  }
};
