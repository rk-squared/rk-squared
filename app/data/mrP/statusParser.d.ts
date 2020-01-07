import { EnlirElement, EnlirSchool, EnlirStat, EnlirStatusPlaceholders } from '../enlir';
import * as statusTypes from './statusTypes';

// NOTE: SyntaxError is not currently exposed.  It's not currently used.
export function parse(input: string, options?: EnlirStatusPlaceholders): statusTypes.StatusEffect;
