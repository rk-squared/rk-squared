// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

{
  let parsedNumberString: number | null = null;

  // Hack: Suppress warnings about unused functions.
  location;
  expected;
  error;
  peg$anyExpectation;
}

SkillEffect
  = head:EffectClause tail:(',' _ EffectClause)* {
    return tail.reduce((result: any, element: any) => {
      result.push(element[2]);
      return result;
    }, [head]);
  }

EffectClause = Attack / DrainHp / RecoilHp / Revive / Heal / DamagesUndead / DispelOrEsuna / ResetIfKO / StatMod / StatusEffect


//---------------------------------------------------------------------------
// Attacks

Attack
  = numAttacks:NumAttacks _ attackType:AttackType modifiers:AttackModifiers _ "attack" "s"?
    _
    "("
      attackMultiplier:DecimalNumberSlashList
      hybridDamageMultiplier:(_ "or" _ n:DecimalNumber { return n; })?
      scaleToMultiplier:('~' n:DecimalNumber { return n; })?
      _ "each"?
      _ multiplierScaleType:MultiplierScaleType?
    ")"
    _ overstrike:("capped" _ "at" _ "99999")?
    _ scaleType:AttackScaleType?
    extras:AttackExtras {
    const result = {
      type: 'attack',
      numAttacks,
      attackMultiplier,
      ...extras
    };
    if (hybridDamageMultiplier != null) {
      result.hybridDamageMultiplier = hybridDamageMultiplier;
    }
    if (scaleToMultiplier != null) {
      result.scaleToMultiplier = scaleToMultiplier;
    }
    if (multiplierScaleType) {
      result.multiplierScaleType = multiplierScaleType;
    }
    if (overstrike) {
      result.isOverstrike = true;
    }
    if (scaleType) {
      result.scaleType = scaleType;
    }
    if (attackType === 'group') {
      result.isAoE = true;
    }
    if (attackType === 'ranged') {
      result.isRanged = true;
    }
    if (modifiers.jump) {
      result.isJump = true;
    }
    if (modifiers.ranged) {
      result.isRanged = true;
    }
    return result;
  }

NumAttacks
  = NumberString / IntegerSlashList

AttackType
  = "group" / "random" / "single"

AttackModifiers
  = modifiers:(_ ("hybrid" / "rang." / "ranged" / "jump"))* {
    return {
      hybrid: modifiers.indexOf('hybrid') !== -1,
      ranged: modifiers.indexOf('ranged') !== -1 || modifiers.indexOf('rang.') !== -1,
      jump: modifiers.indexOf('hybrid') !== -1,
    };
  }


AttackScaleType
  = Condition

MultiplierScaleType
  = "scaling" _ "with" _ "HP%" { return { type: 'percentHp' }; }
  / "scaling" _ "with" _ "targets" { return { type: 'convergent' }; }
  / "scaling" _ "with" _ stat:Stat { return { type: 'stat', stat }; }


AttackExtras
  = extras:("," _ (AdditionalCrit / AirTime / AttackStatusChance / FollowedByAttack / MinDamage / NoMiss / OrMultiplier / Piercing))* {
    return extras.reduce((result: any, element: any) => Object.assign(result, element[2]), {});
  }

AdditionalCrit
  = additionalCrit:Integer '%' _ ('additional' / 'add.') _ 'critical' _ 'chance' condition:(_ Condition)? {
    return util.addCondition({ additionalCrit }, condition);
  }

AirTime
  = "air" _ "time" _ "(" airTime:DecimalNumberSlashList _ "sec."? ")" _ condition:Condition? { return util.addCondition({ airTime }, condition, 'airTimeCondition'); }

AttackStatusChance
  // NOTE: This assumes that each skill only inflicts one status via its attack
  = chance:Integer '%' _ "chance" _ "to" _ "cause" _ status:StatusName _ duration:Duration {
    return { status: { status, chance, duration } };
  }

FollowedByAttack
  = "followed" _ "by" _ followedBy:Attack { return { followedBy }; }

MinDamage
  = "minimum" _ "damage" _ minDamage:Integer { return { minDamage }; }

NoMiss
  = "100%" _ "hit" _ "rate" { return { isNoMiss: true }; }

OrMultiplier
  = orMultiplier:DecimalNumberSlashList _ ("multiplier" / "mult.") _ orMultiplierCondition:Condition {
    return { orMultiplier, orMultiplierCondition };
  }

Piercing
  = "ignores" _ ("DEF" / "RES") { return { isPiercing: true }; }


//---------------------------------------------------------------------------
// Drain HP, recoil HP

DrainHp
  = ("heals" / "restores" _ "HP" _ "to") _ "the" _ "user" _ "for" _ healPercent:Integer "%" _ "of" _ "the" _ "damage" _ "dealt" {
    return {
      type: 'drainHp',
      healPercent
    }
  }

RecoilHp
  = "damages" _ "the" _ "user" _ "for" _ damagePercent:Integer "%"
  _ maxOrCurrent:("max" "."? "imum"? / "current" { return text().startsWith('max') ? 'max' : 'curr'; })
  _ "HP" {
    return {
      type: 'recoilHp',
      damagePercent,
      maxOrCurrent,
    }
  }


//---------------------------------------------------------------------------
// Healing

Revive
  = "removes"i _ "KO" _ "(" percentHp:Integer "%" _ "HP)" _ who:Who? {
    const result = {
      type: 'revive',
      percentHp,
    };
    if (who) {
      result.who = who;
    }
    return result;
  }

Heal
  = "restores"i _ healAmount:(
      "HP" _ "(" healFactor:Integer ")" { return { healFactor }; }
      / fixedHp:IntegerSlashList _ "HP" { return { fixedHp }; }
    ) _ who:Who? _ condition:Condition? {
    return util.addCondition({
      type: 'heal',
      ...healAmount,
      who
    }, condition);
  }

DamagesUndead
  = 'damages' _ 'undeads' {
    return {};
  }

DispelOrEsuna
  = 'removes'i _ dispelOrEsuna:('negative' / 'positive') _ 'status'? _ 'effects' _ who:Who? {
    return { dispelOrEsuna, who };
  }


//---------------------------------------------------------------------------
// Status effects

StatusEffect
  = verb:StatusVerb _ statuses:StatusList {
    return { type: 'status', verb, statuses };
  }

StatusVerb
  = "grants"i / "causes"i / "removes"i / "doesn't"i _ "remove"

StatusList
  = head:StatusWithPercent tail:(!NextClause AndList StatusWithPercent)* {
    return util.pegAndList(head, tail);
  }

StatusWithPercent
  = status:StatusName
    chance:(_ '(' chanceValue:Integer '%)' { return chanceValue; } )?
    statusClauses:StatusClause*
  {
    const result: any = {
      status
    };
    if (chance) {
      result.chance = chance;
    }
    for (const i of statusClauses) {
      Object.assign(result, i);
    }
    return result;
  }

StatusName "status effect"
  = // Stat mods in particular have a distinctive format.
    ([A-Z] [a-z]+ _)? StatList _ SignedInteger '%'
  / // Generic status names - somewhat complex expression to match those
  (
    StatusWord (_
    (
      StatusWord
      / 'in' / 'or'
      / SignedIntegerSlashList '%'?
      / '='? IntegerSlashList '%'?
      / '(' [A-Za-z-0-9]+ ')'
    ))*
  ) {
    return text();
  }
StatusWord = ([A-Z] [a-zA-Z-']* (':' / '...' / '!')?)

StatusClause
  = _ clause:(
    Duration
    / "every" _ "two" _ "uses" { return { perUses: 2 }; }
    / who:Who { return { who }; }
    / "if" _ "successful" { return { ifSuccessful: true }; }
    / "to" _ "undeads" { return { ifUndead: true }; }
    / condition:Condition { return { condition }; }
  ) {
    return clause;
  }


//---------------------------------------------------------------------------
// Stat mods

StatMod
  = stats:StatList _ percent:SignedInteger '%' who:(_ Who)? duration:(_ Duration)? {
    const result: any = {
      type: 'statMod',
      stats,
      percent,
    };
    if (who) {
      result.who = who[1];
    }
    if (duration) {
      result.duration = duration[1];
    }
    return result;
  }

StatList
  = head:Stat tail:(AndList Stat)* {
    return util.pegAndList(head, tail);
  }


//---------------------------------------------------------------------------
// Miscellaneous

ResetIfKO
  = "resets if KO'd" { return { type: 'resetIfKO' }; }


//---------------------------------------------------------------------------
// Lower-level game rules

Duration
  = "for" _ value:Integer _ units:DurationUnits {
    return { value, units };
  }

DurationUnits
  = ("second" / "turn") "s"? {
    let result = text();
    if (!result.endsWith('s')) {
      result += 's';
    }
    return result;
  }

Stat "stat"
  = "ATK" / "DEF" / "MAG" / "RES" / "MND" / "SPD" / "ACC" / "EVA"

NextClause
  = "," _ ("grants" / "causes" / "removes" / "doesn't" _ "remove"
      / "restores" _ "HP"
      / "damages" _ "the" _ "user"
      / "heals" _ "the" _ "user"
      / "casts" _ "the" _ "last" _ "ability" _ "used" _ "by" _ "an" _ "ally"
      / "reset"
  )

Who
  = "to" _ "the" _ "user" { return 'self'; }
  / "to" _ "the" _ "target" { return 'target'; }
  / "to" _ "all" _ "allies" row:(_ "in" _ "the" _ row:("front" / "back" / "character's") _ "row" { return row === "character's" ? 'sameRow' : row + 'frontRow'; })? {
    return row || 'party';
  }
  / "to" _ "the" _ "lowest" _ "HP%" _ "ally" { return 'lowestHpAlly'; }
  / "to" _ "a" _ "random" _ "ally" _ "without" _ "status" { return 'allyWithoutStatus'; }
  / "to" _ "a" _ "random" _ "ally" _ "with" _ "negative" _ "status"? _ "effects" { return 'allyWithNegativeStatus'; }
  / "to" _ "a" _ "random" _ "ally" _ "with" _ "KO" { return 'allyWithKO'; }

Condition
  = "when" _ "equipping" _ "a" "n"? _ equipped:[a-z- ]+ { return { type: 'equipped', equipped: equipped.join('') }; }
  / "if" _ "the" _ who:("user" / "target") _ "has" _ any:"any"? _ status:StatusName { return { type: 'status', status, who: who === 'user' ? 'self' : 'target', any: !!any }; }

  // Attacks and skills (like Passionate Salsa)
  / "at" _ useCount:IntegerSlashList _ "uses" { return { type: 'scaleUseCount', useCount }; }

  // Beginning of attack-specific conditions
  / "if" _ count:IntegerSlashList _ "allies" _ "in" _ "air" { return { type: 'alliesJump', count }; }
  / "if" _ "the" _ "user" _ "used" _ count:IntegerSlashList _ "damaging" _ "actions" { return { type: 'damagingActions', count }; }
  / "if" _ "the" _ "target" _ "has" _ count:IntegerSlashList _ "ailments" { return { type: 'targetStatusAilments', count }; }
  / "if" _ "the" _ "user's" _ "Doom" _ "timer" _ "is" _ "below" _ value:IntegerSlashList { return { type: 'doomTimer', value }; }

  // Alternate status phrasing.  For example, Stone Press:
  // "One single attack (3.00/4.00/7.00) capped at 99999 at Heavy Charge 0/1/2")
  / "at" _ status:StatusName { return { type: 'status', status, who: 'self' }; }

  // Stat thresolds (e.g., Tiamat, Guardbringer)
  / "at" _ value:IntegerSlashList _ stat:Stat { return { type: 'statThreshold', stat, value }; }


//---------------------------------------------------------------------------
// Primitive types

AndList
  = (',' _) / (','? _ 'and' _)

NumberString "numeric text"
  = numberString:[a-zA-Z\-]+
  & { parsedNumberString = util.parseNumberString(numberString.join('')); return parsedNumberString != null; }
  { return parsedNumberString; }


DecimalNumber "decimal number"
  = ([0-9.]+ / '?') { return parseFloat(text()) }

Integer "integer"
  = ([0-9]+ / '?') { return parseInt(text(), 10); }

SignedInteger "signed integer"
  = sign:[+-] _ value:[0-9]+ { return parseInt(sign + value.join(''), 10); }


IntegerSlashList "slash-separated integers"
  = head:Integer tail:('/' Integer)* { return util.pegSlashList(head, tail); }

SignedIntegerSlashList "slash-separated signed integers"
  = sign:[+-] _ values:IntegerSlashList {
    const applySign = (i: number) => sign === '-' ? -i : i;
    if (Array.isArray(values)) {
      return values.map(applySign);
    } else {
      return applySign(values);
    }
  }

DecimalNumberSlashList "slash-separated decimal numbers"
  = head:DecimalNumber tail:('/' DecimalNumber)* { return util.pegSlashList(head, tail); }


_ "whitespace"
  = [ \t\n\r]*
