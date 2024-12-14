import {
  binary_to_base58 as toBase58,
  base58_to_binary as fromBase58,
} from "base58-js";

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
  }
  localStorage.setItem(LsPrefix + key, JSON.stringify(value));
}

export function lsGet(key) {
  const value = localStorage.getItem(LsPrefix + key);
  return value ? JSON.parse(value) : null;
}
