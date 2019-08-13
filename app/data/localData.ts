import { EnlirRelicType } from '../data/enlir';

export type LocalIconType =
  | 'darkElement'
  | 'earthElement'
  | 'fireElement'
  | 'holyElement'
  | 'iceElement'
  | 'lightningElement'
  | 'poisonElement'
  | 'waterElement'
  | 'windElement'
  | 'animaWave1'
  | 'animaWave2'
  | 'animaWaveUnknown'
  | 'mythril'
  | 'odin'
  | 'fatBlackChocobo';

export const localIcons: { [s in LocalIconType]: string | undefined } = {
  darkElement: require('../images/ffrk-icons/dark.png'),
  earthElement: require('../images/ffrk-icons/earth.png'),
  fireElement: require('../images/ffrk-icons/fire.png'),
  holyElement: require('../images/ffrk-icons/holy.png'),
  iceElement: require('../images/ffrk-icons/ice.png'),
  lightningElement: require('../images/ffrk-icons/lightning.png'),
  poisonElement: require('../images/ffrk-icons/poison.png'),
  waterElement: require('../images/ffrk-icons/water.png'),
  windElement: require('../images/ffrk-icons/wind.png'),

  animaWave1: require('../images/game-icons/checkered-diamond-6daf50.svg'),
  animaWave2: require('../images/game-icons/checkered-diamond-d22d2d.svg'),
  animaWaveUnknown: require('../images/game-icons/checkered-diamond-000000.svg'),

  mythril: require('../images/ffrk-icons/mythril.png'),

  odin: require('../images/game-icons/mounted-knight.svg'),
  fatBlackChocobo: require('../images/game-icons/bird-twitter.svg'),
};

export const getAnimaWaveIcon = (anima: number) => {
  const animaWave = `animaWave${anima}`;
  return animaWave in localIcons
    ? localIcons[animaWave as LocalIconType]
    : localIcons.animaWaveUnknown;
};

export const equipmentIcons: { [s in EnlirRelicType]: string | undefined } = {
  Accessory: require('../images/ffrk-icons/accessory.png'),
  Axe: require('../images/ffrk-icons/axe.png'),
  Blitzball: require('../images/ffrk-icons/blitzball.png'),
  Book: require('../images/ffrk-icons/book.png'),
  Bow: require('../images/ffrk-icons/bow.png'),
  Bracer: require('../images/ffrk-icons/bracer.png'),
  Dagger: require('../images/ffrk-icons/dagger.png'),
  Doll: require('../images/ffrk-icons/doll.png'),
  Fist: require('../images/ffrk-icons/fist.png'),
  ['Gambling Gear']: require('../images/ffrk-icons/gambling_gear.png'),
  ['Gun-Arm']: require('../images/ffrk-icons/gun_arm.png'),
  Gun: require('../images/ffrk-icons/gun.png'),
  Hairpin: require('../images/ffrk-icons/hairpin.png'),
  Hammer: require('../images/ffrk-icons/hammer.png'),
  Hat: require('../images/ffrk-icons/hat.png'),
  ['Heavy Armor']: require('../images/ffrk-icons/heavy_armor.png'),
  Helm: require('../images/ffrk-icons/helm.png'),
  Instrument: require('../images/ffrk-icons/instrument.png'),
  Katana: require('../images/ffrk-icons/katana.png'),
  Keyblade: undefined, // TODO: Find an icon for this
  ['Light Armor']: require('../images/ffrk-icons/light_armor.png'),
  Robe: require('../images/ffrk-icons/robe.png'),
  Rod: require('../images/ffrk-icons/rod.png'),
  Shield: require('../images/ffrk-icons/shield.png'),
  Spear: require('../images/ffrk-icons/spear.png'),
  Staff: require('../images/ffrk-icons/staff.png'),
  Sword: require('../images/ffrk-icons/sword.png'),
  Thrown: require('../images/ffrk-icons/thrown.png'),
  Whip: require('../images/ffrk-icons/whip.png'),
};
