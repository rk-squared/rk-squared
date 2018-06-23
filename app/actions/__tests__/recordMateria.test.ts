import { getStatus, RecordMateria, RecordMateriaStatus as Status } from '../recordMateria';

import { Character } from '../characters';

describe('actions/recordMateria', () => {
  const attunement1: RecordMateria = {
    id: 111000020,
    characterId: 10000200,
    characterName: 'Tyro',
    seriesId: 200001,
    condition: 'Awarded for breaking character level cap.',
    description: 'Deal slightly more damage when attacking with an enemy\'s elemental weakness.',
    name: 'Attunement I',
    obtained: true,
    step: 1,
    order: '1a',
    prereqs: [],
  };
  const attunement2: RecordMateria = {
    id: 111000021,
    characterId: 10000200,
    characterName: 'Tyro',
    seriesId: 200001,
    condition: 'Obtain the Attunement I Record Materia. Chance to obtain with the Keeper in your party.',
    description: 'Deal significantly more damage when attacking with an enemy\'s elemental weakness.',
    name: 'Attunement II',
    obtained: true,
    step: 2,
    order: '1b',
    prereqs: [111000020],
  };
  const dmt: RecordMateria = {
    id: 111000022,
    characterId: 10000200,
    characterName: 'Tyro',
    seriesId: 200001,
    condition: 'Break Tyro\'s level cap 2 time(s) and obtain the Attunement II Record Materia. ' +
      'Chance to obtain with the Keeper in your party.',
    description: 'Begin dungeons with 2 Soul Break charges.',
    name: 'Dr. Mog\'s Teachings',
    obtained: false,
    step: 3,
    order: '2',
    prereqs: [111000020, 111000021],
  };
  const scholarsBoon: RecordMateria = {
    id: 111000023,
    characterId: 10000200,
    characterName: 'Tyro',
    seriesId: 200001,
    condition: 'Break Tyro\'s level cap 3 time(s) and obtain the Dr. Mog\'s Teachings Record Materia. ' +
      'Awarded for raising the Keeper to level 99.',
    description: 'Deal much more damage when attacking with an enemy\'s elemental weakness.',
    name: 'Scholar\'s Boon',
    obtained: false,
    step: 4,
    order: '3',
    prereqs: [111000023],
  };
  const tyro: Character = {
    id: 10000200,
    uniqueId: 123,
    name: 'Tyro',
    level: 65,
    levelCap: 80,
  };

  const unobtained = (rm: RecordMateria) => ({ ...rm, obtained: false });

  it('determines record materia status', () => {
    expect(getStatus(scholarsBoon, undefined, [], false, false))
      .toEqual({ status: Status.Unknown, statusDescription: 'Unknown' });

    expect(getStatus(attunement1, tyro, [], true, true))
      .toEqual({ status: Status.Favorite, statusDescription: 'Favorite' });
    expect(getStatus(attunement1, tyro, [], false, false))
      .toEqual({ status: Status.Vault, statusDescription: 'Vault' });

    expect(getStatus(attunement1, tyro, [], true, false))
      .toEqual({ status: Status.Collected, statusDescription: 'Collected' });
    expect(getStatus(attunement2, tyro, [attunement1], true, false))
      .toEqual({ status: Status.Collected, statusDescription: 'Collected' });
    expect(getStatus(dmt, tyro, [attunement1, attunement2], false, false))
      .toEqual({ status: Status.Unlocked, statusDescription: 'Unlocked' });
    expect(getStatus(scholarsBoon, tyro, [attunement1, attunement2, dmt], false, false))
      .toEqual({ status: Status.LockedLowLevel, statusDescription: 'Low level (65/99)' });
  });

  it('checks record materia levels and level caps', () => {
    const dmtPrereqs = [attunement1, attunement2];
    const sbPrereqs = [attunement1, attunement2, dmt];
    const tyro5050 = { ...tyro, level: 50, levelCap: 50 };
    const tyro6565 = { ...tyro, level: 65, levelCap: 65 };
    const tyro6580 = { ...tyro, level: 65, levelCap: 80 };
    const tyro8099 = { ...tyro, level: 80, levelCap: 80 };
    const tyro9999 = { ...tyro, level: 99, levelCap: 80 };
    expect(getStatus(unobtained(attunement1), tyro5050, [], false, false))
      .toEqual({ status: Status.LockedLowLevel, statusDescription: 'Low level (50/50)' });
    expect(getStatus(unobtained(dmt), tyro6565, dmtPrereqs, false, false))
      .toEqual({ status: Status.LockedLowLevel, statusDescription: 'Low level (65/65)' });
    expect(getStatus(unobtained(dmt), tyro6580, dmtPrereqs, false, false))
      .toEqual({ status: Status.Unlocked, statusDescription: 'Unlocked' });
    expect(getStatus(scholarsBoon, tyro8099, sbPrereqs, false, false))
      .toEqual({ status: Status.LockedLowLevel, statusDescription: 'Low level (80/99)' });
    expect(getStatus(scholarsBoon, tyro9999, sbPrereqs, false, false))
      .toEqual({ status: Status.LockedMissingPrereq, statusDescription: 'Missing RM 2' });
  });
});
