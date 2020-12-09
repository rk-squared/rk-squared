import { logException, logger } from '../../utils/logger';
import { EnlirLegendMateria } from '../enlir';
import { describeEnlirStatusEffects, preprocessStatus } from './status';
import * as statusParser from './statusParser';
import * as statusTypes from './statusTypes';

export function safeParseLegendMateria(lm: EnlirLegendMateria): statusTypes.StatusEffect | null {
  try {
    return preprocessStatus(
      statusParser.parse(lm.effect, { startRule: 'LegendMateriaEffect' }),
      lm,
    );
  } catch (e) {
    logger.error(`Failed to process legend materia: ${lm.character} ${lm.name}: ${lm.effect}`);
    logException(e);
    if (e.name === 'SyntaxError') {
      logger.debug(lm.effect);
      logger.debug(' '.repeat(e.location.start.offset) + '^');
      return null;
    }
    throw e;
  }
}

export function describeEnlirLegendMateria(
  lm: EnlirLegendMateria,
): [string, statusTypes.StatusEffect | null] {
  const statusEffects = safeParseLegendMateria(lm);
  if (!statusEffects) {
    return [lm.effect, null];
  }
  const effects = describeEnlirStatusEffects(statusEffects, lm, undefined, undefined, {});
  return [effects, statusEffects];
}

export function describeMrPLegendMateria(lm: EnlirLegendMateria): string | null {
  const result = describeEnlirLegendMateria(lm);
  return result[1] ? result[0] : null;
}
