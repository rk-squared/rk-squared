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

EffectClause = Attack / Heal / DamagesUndead / DispelOrEsuna / StatMod / StatusEffect


//---------------------------------------------------------------------------
// Attacks

Attack
  = numAttacks:NumAttacks _ attackType:AttackType modifiers:AttackModifiers _ "attack" "s"?
    _ "(" attackMultiplier:DecimalNumber _ "each"? ")"
    _ overstrike:("capped" _ "at" _ "99999")?
    extras:AttackExtras {
    const result = {
      numAttacks,
      attackMultiplier,
      ...extras
    };
    if (overstrike) {
      result.isOverstrike = true;
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
  = NumberString

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

AttackExtras
  = extras:("," _ (MinDamage / Piercing / NoMiss / AirTime / FollowedByAttack))* {
    return extras.reduce((result: any, element: any) => Object.assign(result, element[2]), {});
  }

MinDamage
  = "minimum" _ "damage" _ minDamage:Integer {
    return { minDamage };
  }

Piercing
  = "ignores" _ ("DEF" / "RES") {
    return { isPiercing: true };
  }

NoMiss
  = "100%" _ "hit" _ "rate" {
    return { isNoMiss: true };
  }

AirTime
  = "air" _ "time" _ "(" airTime:DecimalNumber _ "sec.)" {
    return { airTime };
  }

FollowedByAttack
  = "followed" _ "by" _ followedBy:Attack {
    return { followedBy };
  }


//---------------------------------------------------------------------------
// Healing

Heal
  = "restores"i _ "HP" _ "(" healFactor:Integer ")" {
    return {
      healFactor
    };
  }

DamagesUndead
  = 'damages' _ 'undeads' {
    return {};
  }

DispelOrEsuna
  = 'removes'i _ dispelOrEsuna:('negative' / 'positive') _ 'status'? _ 'effects' {
    return { dispelOrEsuna };
  }


//---------------------------------------------------------------------------
// Status effects

StatusEffect
  = verb:StatusVerb _ statuses:StatusList {
    return { verb, statuses };
  }

StatusVerb
  = "grants"i / "causes"i / "removes"i / "doesn't"i _ "remove"

StatusList
  = head:StatusWithPercent tail:(!NextClause AndList StatusWithPercent)* {
    return util.pegAndList(head, tail);
  }

StatusWithPercent
  = status:Status chance:(_ '(' chanceValue:Integer '%)' { return chanceValue; } )? {
    return chance ? { status, chance } : { status };
  }

Status "status effect"
  = ([A-Z] [a-z]+ _)? StatList _ SignedInteger '%'
  / (
    StatusWord (_
    (
      StatusWord
      / 'in'
      / SignedInteger '%'?
      / Integer '%'?
      / '(' [A-Za-z-0-9]+ ')'
    ))*
  ) {
    return text();
  }
StatusWord = ([A-Z] [a-zA-Z-']* (':' / '...' / '!')?)


//---------------------------------------------------------------------------
// Stat mods

StatMod
  = stats:StatList _ percent:SignedInteger '%' duration:(_ Duration)? {
    const result: any = {
      stats,
      percent,
    };
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
// Lower-level game rules

Duration
  = "for" _ duration:Integer _ "second" "s"? {
    return duration;
  }

Stat
  = "ATK" / "DEF" / "MAG" / "RES" / "MND" / "SPD" / "ACC" / "EVA"

NextClause
  = "," _ ("grants" / "causes" / "removes" / "doesn't" _ "remove"
      / "restores" _ "HP"
      / "damages" _ "the" _ "user"
      / "heals" _ "the" _ "user"
      / "casts" _ "the" _ "last" _ "ability" _ "used" _ "by" _ "an" _ "ally"
      / "reset"
  )


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

_ "whitespace"
  = [ \t\n\r]*
