{
  // Hack: Suppress warnings about unused functions.
  location;
  expected;
  error;
  peg$anyExpectation;
}

StatusEffect
  = head:EffectClause tail:((',' _) EffectClause)* {
    return util.pegList(head, tail, 2);
  }
  / "" { return []; }

EffectClause = CritChance

CritChance
  = "Critical" _ "chance" _ "=" value:Integer "%" { return { type: 'critChance', value }; }


// --------------------------------------------------------------------------
// Primitive types

Integer "integer"
  = ([0-9]+ / '?') { return parseInt(text(), 10); }

_ "whitespace"
  = [ \t\n\r]*
