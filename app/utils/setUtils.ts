/**
 * @file
 * Set functions from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
 */

export function isSuperset<T>(set: Set<T>, subset: Set<T>) {
  const it = subset.values();
  let elem = it.next();
  while (!elem.done) {
    if (!set.has(elem.value)) {
      return false;
    }
    elem = it.next();
  }
  return true;
}

export function union<T>(setA: Set<T>, setB: Set<T>) {
  const result = new Set(setA);
  const it = setB.values();
  let elem = it.next();
  while (!elem.done) {
    result.add(elem.value);
    elem = it.next();
  }
  return result;
}

export function intersection<T>(setA: Set<T>, setB: Set<T>) {
  const result = new Set();
  const it = setB.values();
  let elem = it.next();
  while (!elem.done) {
    if (setA.has(elem.value)) {
      result.add(elem.value);
    }
    elem = it.next();
  }
  return result;
}

export function difference<T>(setA: Set<T>, setB: Set<T>) {
  const result = new Set(setA);
  const it = setB.values();
  let elem = it.next();
  while (!elem.done) {
    result.delete(elem.value);
    elem = it.next();
  }
  return result;
}
