import Big from "big.js";

Big.DP = 27;

// Constants
const DEFAULT_NETWORK_ID = "mainnet";
const NETWORKS = {
  testnet: {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.fastnear.com/",
  },
  mainnet: {
    networkId: "mainnet",
    nodeUrl: "https://rpc.mainnet.fastnear.com/",
  },
};

// State
let _config = { ...NETWORKS[DEFAULT_NETWORK_ID] };
let _accountId = null;
let _publicKey = null;
const _txHistory = [];
const _eventListeners = {
  account: new Set(),
  tx: new Set(),
};

// Utils
function parseJsonFromBytes(bytes) {
  try {
    return JSON.parse(Buffer.from(bytes).toString());
  } catch (e) {
    try {
      return Buffer.from(bytes);
    } catch (e) {
      return bytes;
    }
  }
}

function withBlockId(params, blockId) {
  return blockId === "final" || blockId === "optimistic"
    ? { ...params, finality: blockId }
    : !!blockId
      ? { ...params, block_id: blockId }
      : { ...params, finality: "optimistic" };
}

async function queryRpc(method, params) {
  const response = await fetch(_config.nodeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `fastnear-${Date.now()}`,
      method,
      params,
    }),
  });

  const result = await response.json();
  if (result.error) {
    throw new Error(`RPC Error: ${result.error.message}`);
  }
  return result.result;
}

// Event Notifiers
function notifyAccountListeners(accountId) {
  _eventListeners.account.forEach((callback) => {
    try {
      callback(accountId);
    } catch (e) {
      console.error(e);
    }
  });
}

function notifyTxListeners(tx) {
  _eventListeners.tx.forEach((callback) => {
    try {
      callback(accountId);
    } catch (e) {
      console.error(e);
    }
  });
}

function convertUnit(s) {
  // Convert from `100 NEAR` into yoctoNear
  if (s.includes(" ")) {
    const [amount, unit] = s.split(" ");
    switch (unit.toLowerCase()) {
      case "near":
        return Big(amount).mul(Big(10).pow(24)).toFixed(0);
      case "tgas":
        return Big(amount).mul(Big(10).pow(12)).toFixed(0);
      case "gas" || "yoctonear":
        return Big(amount).toFixed(0);
      default:
        throw new Error(`Unknown unit: ${unit}`);
    }
  }
  return Big(s).toFixed(0);
}

// Core API Implementation
const api = {
  // Context
  get accountId() {
    return _accountId;
  },

  get publicKey() {
    return _publicKey;
  },

  config(newConfig) {
    if (newConfig) {
      _config = { ..._config, ...newConfig };
    }
    return _config;
  },

  get authStatus() {
    if (!_accountId) return "SignedOut";

    // Check for limited access key
    const accessKey = _publicKey;
    if (accessKey) {
      return {
        type: "SignedInWithLimitedAccessKey",
        accessKey,
      };
    }
    return "SignedIn";
  },

  // Query Methods
  async view({ contract, method, args, argsBase64, blockId }) {
    const encodedArgs =
      argsBase64 ||
      (args ? Buffer.from(JSON.stringify(args)).toString("base64") : "");

    const result = await queryRpc(
      "query",
      withBlockId(
        {
          request_type: "call_function",
          account_id: contract,
          method_name: method,
          args_base64: encodedArgs,
        },
        blockId,
      ),
    );

    return parseJsonFromBytes(result.result);
  },

  async account({ accountId, blockId }) {
    return queryRpc(
      "query",
      withBlockId(
        {
          request_type: "view_account",
          account_id: accountId,
        },
        blockId,
      ),
    );
  },

  async block({ blockId }) {
    return queryRpc("block", withBlockId({}, blockId));
  },

  async accessKey({ accountId, publicKey, blockId }) {
    return queryRpc(
      "query",
      withBlockId(
        {
          request_type: "view_access_key",
          account_id: accountId,
          public_key: publicKey,
        },
        blockId,
      ),
    );
  },

  async tx({ txHash, accountId }) {
    return queryRpc("tx", [txHash, accountId]);
  },

  localTxHistory() {
    return [..._txHistory];
  },

  // Transaction Methods
  async sendTx({ receiverId, actions, ...rest }) {
    if (!_accountId) throw new Error("Not signed in");

    const accessKey = await this.accessKey({
      accountId: _accountId,
      publicKey: _publicKey,
    });

    const block = await this.block({ blockId: "final" });

    const txHash = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const txStatus = {
      id: txHash,
      signerId: _accountId,
      receiverId,
      actions,
      status: "pending",
      timestamp: Date.now(),
      ...rest,
    };

    _txHistory.push(txStatus);
    notifyTxListeners(txStatus);

    // TODO: Implement actual transaction signing and sending
    // This would require wallet integration

    return txHash;
  },

  // Authentication Methods
  async requestSignIn({ contractId }) {
    // TODO: Implement actual wallet redirect, etc
  },

  signOut() {
    _accountId = null;
    _publicKey = null;
    notifyAccountListeners(null);

    // TODO: Implement actual wallet integration
  },

  // Event Handlers
  onAccount(callback) {
    _eventListeners.account.add(callback);
  },

  onTx(callback) {
    _eventListeners.tx.add(callback);
  },

  // Action Helpers
  actions: {
    functionCall: ({ methodName, gas, deposit, args, argsBase64 }) => ({
      type: "FunctionCall",
      methodName,
      args,
      argsBase64,
      gas,
      deposit,
    }),

    transfer: (yoctoAmount) => ({
      type: "Transfer",
      deposit: yoctoAmount,
    }),

    stakeNEAR: ({ amount, publicKey }) => ({
      type: "Stake",
      stake: amount,
      publicKey,
    }),

    addFullAccessKey: ({ publicKey }) => ({
      type: "AddKey",
      publicKey: publicKey,
      accessKey: { permission: "FullAccess" },
    }),

    addLimitedAccessKey: ({
      publicKey,
      allowance,
      accountId,
      methodNames,
    }) => ({
      type: "AddKey",
      publicKey: publicKey,
      accessKey: {
        permission: "FunctionCall",
        allowance,
        receiverId: accountId,
        methodNames,
      },
    }),

    deleteKey: ({ publicKey }) => ({
      type: "DeleteKey",
      publicKey,
    }),

    deleteAccount: ({ beneficiaryId }) => ({
      type: "DeleteAccount",
      beneficiaryId,
    }),

    createAccount: () => ({
      type: "CreateAccount",
    }),

    deployContract: ({ code }) => ({
      type: "DeployContract",
      code,
    }),
  },
};

// Handle wallet redirect if applicable
// TODO: Implement actual wallet integration
try {
  const url = new URL(window.location.href);
  const accountId = url.searchParams.get("account_id");
  const publicKey = url.searchParams.get("public_key");
  const errorCode = url.searchParams.get("error_code");

  if (errorCode) {
    throw new Error(`Wallet error: ${errorCode}`);
  }

  if (accountId && publicKey) {
    _accountId = accountId;
    _publicKey = publicKey;
    notifyAccountListeners(accountId);
  }
} catch (e) {
  console.error("Error handling wallet redirect:", e);
}

export { api, convertUnit };
