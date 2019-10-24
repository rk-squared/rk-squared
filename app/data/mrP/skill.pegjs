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
  = numAttacks:NumAttacks _ attackType:AttackType _ "attack" "s"? _ "(" multiplier:DecimalNumber _ "each"? ")"

NumAttacks
  = NumberString

NumberString
  = [a-zA-Z\-]+ { 
    const result = parseNumberString(text());
    if (result == null) {
      expected('numeric string');
    }
    return result;
  }

DecimalNumber
  = [0-9.]+ { return parseFloat(text()) }

AttackType
  = "group" / "random" / "single"

Ranged
  = "rang." / "ranged"

_ "whitespace"
  = [ \t\n\r]*
