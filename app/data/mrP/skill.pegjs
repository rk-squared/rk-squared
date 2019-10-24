// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

{
  const { parseNumberString } = require('./util');
}

SkillEffect
  = Attack

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
    return extras.reduce((result, element) => Object.assign(result, element[2]), {});
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


NumberString
  = [a-zA-Z\-]+ {
    const result = parseNumberString(text());
    if (result == null) {
      expected('numeric string');
    }
    return result;
  }

DecimalNumber "decimal number"
  = [0-9.]+ { return parseFloat(text()) }

Integer "integer"
  = [0-9]+ { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*
