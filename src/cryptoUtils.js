import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha2";
import { fromBase58, toBase58 } from "./utils";

export { sha256 };

export const keyFromString = (key) =>
  fromBase58(
    key.includes(":")
      ? (() => {
          const [curve, keyPart] = key.split(":");
          if (curve !== "ed25519") {
            throw new Error(`Unsupported curve: ${curve}`);
          }
          return keyPart;
        })()
      : key,
  );

export const keyToString = (key) => `ed25519:${toBase58(key)}`;

export function publicKeyFromPrivate(privateKey) {
  privateKey = keyFromString(privateKey).slice(0, 32);
  const publicKey = ed25519.getPublicKey(privateKey);
  return keyToString(publicKey);
}

export function privateKeyFromRandom() {
  const privateKey = crypto.getRandomValues(new Uint8Array(64));
  return keyToString(privateKey);
}

export function signHash(hash, privateKey) {
  privateKey = keyFromString(privateKey).slice(0, 32);
  const signature = ed25519.sign(fromBase58(hash), privateKey);
  return toBase58(signature);
}

export function signBytes(bytes, privateKey) {
  const hash = sha256(bytes);
  return signHash(toBase58(hash), privateKey);
}
