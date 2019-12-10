{
  let parsedNumberString = null;

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
  = StatMod / CritChance / StatusChance
  / CastSpeed
  / ElementBuff / ElementDebuff / ElementBlink / ElementResist / EnElement / EnElementWithStacking / LoseEnElement / LoseAnyEnElement
  / AbilityDouble
  / CastSkill / GrantStatus
  / ImmuneAttackSkills / ImmuneAttacks
  / TurnDuration
  / BurstToggle / SkillCounter / BurstOnly / BurstReset / Ai


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

StatusChance
  = "Increases the chance of inflicting Status by" _ value:IntegerOrX "%" { return { type: 'statusChance', value }; }


// --------------------------------------------------------------------------
// Cast speed

CastSpeed
  = "Cast"i _ "speed x" value:DecimalNumber { return { type: 'castSpeed', value }; }


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
// Abilities

AbilityDouble
  = "dualcasts" _ school:School _ "abilities consuming an extra ability use" { return { type: 'abilityDouble', school }; }


// --------------------------------------------------------------------------
// Abilities and status effects

CastSkill
  = "casts"i _ skill:AnySkillName _ trigger:Trigger? { return { type: 'castSkill', skill, trigger }; }

GrantStatus
  = "grants"i _ status:StatusName _ trigger:Trigger? { return { type: 'grantsStatus', status, trigger }; }


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
// Special durations

TurnDuration
  = "lasts for" _ value:Integer _ "turn" "s"? { return { type: 'duration', duration: { value, units: 'turns' } }; }


// --------------------------------------------------------------------------
// Other

BurstToggle
  = "Affects"i _ "certain Burst Commands"

SkillCounter
  = "Keeps"i _ "track of the number of uses of" _ skill:AnySkillName { return { type: 'skillCounter', skill }; }

BurstOnly
  = "removed if the user hasn't Burst Mode" { return { type: 'burstOnly' }; }

BurstReset
  = "reset upon refreshing Burst Mode" { return { type: 'burstReset' }; }

Ai
  = "Affects"i _ GenericName _ "behaviour" { return { type: 'ai' }; }


// --------------------------------------------------------------------------
// Triggers

Trigger
  = "after using a" "n"? _ element:ElementList _ "attack" { return { type: 'elementAttack', element }; }
  / "after using" _ count:ArticleOrNumberString _ ("ability" / "abilities") { return { type: 'anyAbility', count }; }
  / "after using" _ count:ArticleOrNumberString _ school:SchoolList _ ("ability" / "abilities") { return { type: 'schoolAbility', school, count }; }


// --------------------------------------------------------------------------
// Lower-level game rules

StatusName "status effect"
  = (
    // Stat mods in particular have a distinctive format.
    ([A-Z] [a-z]+ _)? StatList _ SignedInteger '%'
  / GenericName
  / "?"
  ) {
    return text();
  }

// These probably don't cover all abilities and characters, but it works for now.
AbilityName
  = UppercaseWord (_ UppercaseWord)* { return text(); }
CharacterName
  = UppercaseWord (_ (UppercaseWord / "of"))* (_ "(" [A-Z] [A-Za-z0-9-]+ ")")? { return text(); }

// Character names, for "if X are in the party."  Return these as text so that
// higher-level code can process them.
CharacterNameList
  = CharacterName ((_ "&" _ / "/" / _ "or" _) CharacterName)* { return text(); }

// Any skill - burst commands, etc. ??? is referenced in one particular status.
AnySkillName
  = GenericName / '???'

// Generic names.  Somewhat complex expression to match these.  Developed for
// statuses, so the rules may need revision for other uses.
GenericName
  = (
    (GenericNameWord
      // Names can start with numbers, but require a word after that, so that
      // "100%" doesn't get parsed as a status name by itself.
      / IntegerSlashList '%' !(_ "hit" _ "rate") _ GenericNameWord
      / SignedIntegerSlashList [%+]? _ GenericNameWord
    )
    (_
      (
        GenericNameWord

        // Articles, etc., are okay, but use &' ' to make sure they're at a
        // word bounary.
        / (('in' / 'or' / 'of' / 'the' / 'with' / '&' / 'a') & ' ')
        // "for" in particular needs extra logic to ensure that it's part of
        // status words instead of part of the duration.
        / "for" _ GenericNameWord

        / SignedIntegerSlashList [%+]?
        / [=*]? IntegerSlashList [%+]?
        / '(' [A-Za-z-0-9/]+ ')'
      )
    )*
  ) {
    return text();
  }
GenericNameWord = ([A-Z] [a-zA-Z-'/]* (':' / '...' / '!' / '+')?)

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

School "ability school"
  = "Bard"
  / "Black Magic"
  / "Celerity"
  / "Combat"
  / "Dancer"
  / "Darkness"
  / "Dragoon"
  / "Heavy"
  / "Knight"
  / "Machinist"
  / "Monk"
  / "Ninja"
  / "Samurai"
  / "Sharpshooter"
  / "Special"
  / "Spellblade"
  / "Summoning"
  / "Support"
  / "Thief"
  / "White Magic"
  / "Witch"

SchoolList "element list"
  = head:School tail:(OrList School)* { return util.pegList(head, tail, 1, true); }

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

NumberString "numeric text"
  = numberString:[a-zA-Z\-]+
  & { parsedNumberString = util.parseNumberString(numberString.join('')); return parsedNumberString != null; }
  { return parsedNumberString; }

ArticleOrNumberString
  = NumberString
  / ("a" "n"?) { return 1; }


DecimalNumber "decimal number"
  = ([0-9.]+ / '?') { return parseFloat(text()) }

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

IntegerSlashList "slash-separated integers"
  = head:Integer tail:('/' Integer)* { return util.pegSlashList(head, tail); }

SignedIntegerSlashList "slash-separated signed integers"
  = sign:[+-] _ values:IntegerSlashList {
    const applySign = (i) => sign === '-' ? -i : i;
    if (Array.isArray(values)) {
      return values.map(applySign);
    } else {
      return applySign(values);
    }
  }


UppercaseWord
  = [A-Z] [A-Za-z]+ { return text(); }

_ "whitespace"
  = [ \t\n\r]*
