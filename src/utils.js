import {
  binary_to_base58 as toBase58,
  base58_to_binary as fromBase58,
} from "base58-js";
import Big from "big.js";

export { toBase58, fromBase58 };

const LsPrefix = "__fastnear_";

export function toBase64(data) {
  return Buffer.from(data).toString("base64");
}

export function fromBase64(data) {
  return Buffer.from(data, "base64");
}

export function lsSet(key, value) {
  if (value === null || value === undefined) {
    localStorage.removeItem(LsPrefix + key);
  } else {
    localStorage.setItem(LsPrefix + key, JSON.stringify(value));
  }
}

export function lsGet(key) {
  const value = localStorage.getItem(LsPrefix + key);
  return tryParseJson(value, null);
}

export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function tryParseJson(...args) {
  try {
    return JSON.parse(args[0]);
  } catch {
    if (args.length > 1) {
      return args[1];
    }
    return args[0];
  }
}

export function canSignWithLAK(actions) {
  return (
    actions.length === 1 &&
    actions[0].type === "FunctionCall" &&
    Big(actions[0]?.deposit ?? "0").eq(0)
  );
}
