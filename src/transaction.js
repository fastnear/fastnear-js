import { serialize as borshSerialize } from "borsh";
import { keyFromString } from "./crypto";
import { fromBase58, fromBase64 } from "./utils";

export function serializeTransaction(transaction) {
  return borshSerialize(SCHEMA.Transaction, transaction);
}

export function mapAction(action) {
  switch (action.type) {
    case "CreateAccount": {
      return {
        createAccount: {},
      };
    }
    case "DeployContract": {
      return {
        deployContract: {
          code: fromBase64(action.codeBase64),
        },
      };
    }
    case "FunctionCall": {
      return {
        functionCall: {
          methodName: action.methodName,
          args: action.argsBase64
            ? fromBase64(action.argsBase64)
            : Buffer.from(JSON.stringify(action.args)),
          gas: BigInt(action.gas),
          deposit: BigInt(action.deposit),
        },
      };
    }
    case "Transfer": {
      return {
        transfer: {
          deposit: BigInt(action.deposit),
        },
      };
    }
    case "Stake": {
      return {
        stake: {
          stake: BigInt(action.stake),
          publicKey: {
            ed25519Key: keyFromString(action.publicKey),
          },
        },
      };
    }
    case "AddKey": {
      return {
        addKey: {
          publicKey: keyFromString(action.publicKey),
          accessKey: {
            nonce: BigInt(action.accessKey.nonce),
            permission:
              action.accessKey.permission === "FullAccess"
                ? { fullAccess: {} }
                : {
                    functionCall: {
                      allowance: action.accessKey.allowance
                        ? BigInt(action.accessKey.allowance)
                        : null,
                      receiverId: action.accessKey.receiverId,
                      methodNames: action.accessKey.methodNames,
                    },
                  },
          },
        },
      };
    }
    case "DeleteKey": {
      return {
        deleteKey: {
          publicKey: keyFromString(action.publicKey),
        },
      };
    }
    case "DeleteAccount": {
      return {
        deleteAccount: {
          beneficiaryId: action.beneficiaryId,
        },
      };
    }
    case "SignedDelegate": {
      return {
        signedDelegate: {
          delegateAction: mapAction(action.delegateAction),
          signature: {
            ed25519Signature: fromBase58(action.signature),
          },
        },
      };
    }
    default: {
      throw new Error("Not implemented action: " + action.type);
    }
  }
}

export const SCHEMA = new (class BorshSchema {
  Ed25519Signature = {
    struct: {
      data: { array: { type: "u8", len: 64 } },
    },
  };
  Secp256k1Signature = {
    struct: {
      data: { array: { type: "u8", len: 65 } },
    },
  };
  Signature = {
    enum: [
      { struct: { ed25519Signature: this.Ed25519Signature } },
      { struct: { secp256k1Signature: this.Secp256k1Signature } },
    ],
  };
  Ed25519Data = {
    struct: {
      data: { array: { type: "u8", len: 32 } },
    },
  };
  Secp256k1Data = {
    struct: {
      data: { array: { type: "u8", len: 64 } },
    },
  };
  PublicKey = {
    enum: [
      { struct: { ed25519Key: this.Ed25519Data } },
      { struct: { secp256k1Key: this.Secp256k1Data } },
    ],
  };
  FunctionCallPermission = {
    struct: {
      allowance: { option: "u128" },
      receiverId: "string",
      methodNames: { array: { type: "string" } },
    },
  };
  FullAccessPermission = {
    struct: {},
  };
  AccessKeyPermission = {
    enum: [
      { struct: { functionCall: this.FunctionCallPermission } },
      { struct: { fullAccess: this.FullAccessPermission } },
    ],
  };
  AccessKey = {
    struct: {
      nonce: "u64",
      permission: this.AccessKeyPermission,
    },
  };
  CreateAccount = {
    struct: {},
  };
  DeployContract = {
    struct: {
      code: { array: { type: "u8" } },
    },
  };
  FunctionCall = {
    struct: {
      methodName: "string",
      args: { array: { type: "u8" } },
      gas: "u64",
      deposit: "u128",
    },
  };
  Transfer = {
    struct: {
      deposit: "u128",
    },
  };
  Stake = {
    struct: {
      stake: "u128",
      publicKey: this.PublicKey,
    },
  };
  AddKey = {
    struct: {
      publicKey: this.PublicKey,
      accessKey: this.AccessKey,
    },
  };
  DeleteKey = {
    struct: {
      publicKey: this.PublicKey,
    },
  };
  DeleteAccount = {
    struct: {
      beneficiaryId: "string",
    },
  };
  ClassicAction = {
    enum: [
      { struct: { createAccount: this.CreateAccount } },
      { struct: { deployContract: this.DeployContract } },
      { struct: { functionCall: this.FunctionCall } },
      { struct: { transfer: this.Transfer } },
      { struct: { stake: this.Stake } },
      { struct: { addKey: this.AddKey } },
      { struct: { deleteKey: this.DeleteKey } },
      { struct: { deleteAccount: this.DeleteAccount } },
    ],
  };
  DelegateAction = {
    struct: {
      senderId: "string",
      receiverId: "string",
      actions: { array: { type: this.ClassicAction } },
      nonce: "u64",
      maxBlockHeight: "u64",
      publicKey: this.PublicKey,
    },
  };
  SignedDelegate = {
    struct: {
      delegateAction: this.DelegateAction,
      signature: this.Signature,
    },
  };
  Action = {
    enum: [
      { struct: { createAccount: this.CreateAccount } },
      { struct: { deployContract: this.DeployContract } },
      { struct: { functionCall: this.FunctionCall } },
      { struct: { transfer: this.Transfer } },
      { struct: { stake: this.Stake } },
      { struct: { addKey: this.AddKey } },
      { struct: { deleteKey: this.DeleteKey } },
      { struct: { deleteAccount: this.DeleteAccount } },
      { struct: { signedDelegate: this.SignedDelegate } },
    ],
  };
  Transaction = {
    struct: {
      signerId: "string",
      publicKey: this.PublicKey,
      nonce: "u64",
      receiverId: "string",
      blockHash: { array: { type: "u8", len: 32 } },
      actions: { array: { type: this.Action } },
    },
  };
  SignedTransaction = {
    struct: {
      transaction: this.Transaction,
      signature: this.Signature,
    },
  };
})();
