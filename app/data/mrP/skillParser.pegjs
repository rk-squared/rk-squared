// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

{
  // Hack: Suppress warnings about unused functions.
  location;
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

EffectClause = Attack / StatMod


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
// Stat mods

StatMod
  = stats:StatList _ percent:SignedInteger '%' duration:(_ Duration)? {
    const result = {
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
    return tail.reduce((result: any, element: any) => {
      result.push(element[2]);
      return result;
    }, [head]);
  }


//---------------------------------------------------------------------------
// Lower-level game types

Duration
  = "for" _ duration:Integer _ "second" "s"? {
    return duration;
  }

Stat
  = "ATK" / "DEF" / "MAG" / "RES" / "MND" / "SPD" / "ACC" / "EVA"


//---------------------------------------------------------------------------
// Primitive types

AndList
  = (',' _) / (','? _ 'and' _)

NumberString
  = [a-zA-Z\-]+
  & { return util.parseNumberString(text()) != null; }
  { return util.parseNumberString(text()); }

DecimalNumber "decimal number"
  = [0-9.]+ { return parseFloat(text()) }

Integer "integer"
  = [0-9]+ { return parseInt(text(), 10); }

SignedInteger "signed integer"
  = sign:[+-] _ value:[0-9]+ { return parseInt(sign + value.join(''), 10); }

_ "whitespace"
  = [ \t\n\r]*
