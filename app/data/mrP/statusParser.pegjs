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
  = CritChance / ElementBlink / ElementResist

CritChance
  = "Critical" _ "chance" _ "=" value:Integer "%" { return { type: 'critChance', value }; }

ElementBlink
  = "Reduces"i _ "the" _ "damage" _ "of" _ "the" _ "next" _ "attack" _ "that" _ "deals" _ element:Element _ "damage" _ "to" _ "0" { return { type: 'elementBlink', element, level: 1 }; }

ElementResist
  = element:Element _ "Resistance" _ value:SignedIntegerOrX "%" cumulable:("," _ "cumulable")? { return { type: 'elementResist', value, cumulable: !!cumulable }; }


// --------------------------------------------------------------------------
// Lower-level game rules

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


// --------------------------------------------------------------------------
// Primitive types

AndList
  = (',' _ 'and'? _) / (_ 'and' _)

OrList
  = (',' _ 'or'? _) / (_ 'or' _)

Integer "integer"
  = ([0-9]+ / '?') { return parseInt(text(), 10); }

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
