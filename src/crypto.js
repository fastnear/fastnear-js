import { ed25519 } from "@noble/curves/ed25519";
import { fromBase58, toBase58 } from "./utils";

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
  privateKey = keyFromString(privateKey);
  const pubKey = ed25519.getPublicKey(privateKey.slice(0, 32));
  return keyToString(pubKey);
}
