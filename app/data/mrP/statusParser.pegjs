{
  // Hack: Suppress warnings about unused functions.
  location;
  expected;
  error;
  peg$anyExpectation;

  function getX() {
    return options.xValue != null ? options.xValue : NaN;
  }
}

StatusEffect
  = head:EffectClause tail:(',' _ EffectClause)* {
    return util.pegList(head, tail, 2);
  }
  / "" { return []; }

EffectClause
  = StatMod / CritChance
  / ElementBuff / ElementDebuff / ElementBlink / ElementResist / EnElement / EnElementWithStacking / LoseEnElement / LoseAnyEnElement
  / ImmuneAttackSkills / ImmuneAttacks


// --------------------------------------------------------------------------
// Stat mods

StatMod
  = stats:StatList _ value:SignedIntegerOrX "%" ignoreBuffCaps:(_ "(ignoring the buff stacking caps)")? {
    const result = { type: 'statMod', value };
    if (ignoreBuffCaps) {
      result.ignoreBuffCaps = true;
    }
    return result;
  }

CritChance
  = "Critical chance =" value:IntegerOrX "%" { return { type: 'critChance', value }; }


// --------------------------------------------------------------------------
// Element buffs and debuffs

ElementBuff
  = "Increases"i _ element:Element _ "damage dealt by" _ value:Integer _ "%, cumulable" { return { type: 'elementAttack', element, value, cumulable: true }; }

ElementDebuff
  = "Reduces"i _ element:Element _ "damage dealt by" _ value:Integer _ "%, cumulable" { return { type: 'elementAttack', element, value: -value, cumulable: true }; }

ElementBlink
  = "Reduces"i _ "the damage of the next attack that deals" _ element:Element _ "damage to 0" { return { type: 'elementBlink', element, level: 1 }; }

ElementResist
  = element:Element _ "Resistance" _ value:SignedIntegerOrX "%" cumulable:("," _ "cumulable")? { return { type: 'elementResist', value, cumulable: !!cumulable }; }

EnElement
  = "Replaces Attack command, increases" _ element:Element _ "damage dealt by 50/80/120% (abilities) or 80/100/120% (Soul Breaks)," _ element2:Element _ "resistance +20%" {
    return { type: 'enElement', element };
  }

EnElementWithStacking
  = "Increase Attach" _ element:Element _ "Level by" _ level:Integer _ "and increase Max Attach Element Level by 2, up to Attach" _ element2:Element _ "3" {
    return { type: 'enElementWithStacking', element, level };
  }

LoseEnElement
  = "Decrease Attach" _ element:Element _ "Level by" _ level:Integer { return { type: 'loseEnElement', element, level }; }

LoseAnyEnElement
  = "Decrease any attached element's level by" _ level:Integer { return { type: 'loseEnElement', level }; }


// --------------------------------------------------------------------------
// Unique statuses

ImmuneAttackSkills
  = "Can't be hit by" _ nonRanged:("non-ranged")? _ skillType:SkillTypeList _ "attacks" {
    return {
      type: 'immune',
      attacks: true,
      skillType,
      nonRanged: !!nonRanged
    }
  }

ImmuneAttacks
  = "Can't be hit by any attack" {
    return {
      type: 'immune',
      attacks: true,
    }
  }


// --------------------------------------------------------------------------
// Lower-level game rules

Stat "stat"
  = ("ATK" / "DEF" / "MAG" / "RES" / "MND" / "SPD" / "ACC" / "EVA") {
    return text().toLowerCase();
  }

StatList "stat list"
  = head:Stat tail:(AndList Stat)* { return util.pegList(head, tail, 1, true); }

Element "element"
  = "Fire"
  / "Ice"
  / "Lightning"
  / "Earth"
  / "Wind"
  / "Water"
  / "Holy"
  / "Dark"
  / "Poison"
  / "NE"

ElementList "element list"
  = head:Element tail:(OrList Element)* { return util.pegList(head, tail, 1, true); }

SkillType "skill type"
  = "PHY"
  / "WHT"
  / "BLK"
  / "BLU"
  / "SUM"
  / "NAT"
  / "NIN"

SkillTypeList "skill type list"
  = head:SkillType tail:(OrList SkillType)* { return util.pegList(head, tail, 1, true); }


// --------------------------------------------------------------------------
// Primitive types

AndList
  = (',' _ 'and'? _) / (_ 'and' _)

OrList
  = (',' _ 'or'? _) / (_ 'or' _)

Integer "integer"
  = ([0-9]+ / '?') { return parseInt(text(), 10); }

IntegerOrX "integer or X"
  = Integer / "X" { return getX(); }

SignedInteger "signed integer"
  = sign:[+-] _ value:[0-9]+ { return parseInt(sign + value.join(''), 10); }

SignedIntegerOrX "signed integer or X"
  = sign:[+-] _ value:([0-9]+ / "X") {
    if (value === 'X') {
      return getX();
    } else {
      return parseInt(sign + value.join(''), 10);
    }
  }

_ "whitespace"
  = [ \t\n\r]*
