// Constants
const DEFAULT_NETWORK_ID = 'testnet';
const NETWORKS = {
    testnet: {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.fastnear.com/',
    },
    mainnet: {
        networkId: 'mainnet',
        nodeUrl: 'https://rpc.mainnet.fastnear.com/',
    }
};

// State
let _config = { ...NETWORKS[DEFAULT_NETWORK_ID] };
let _accountId = null;
let _publicKey = null;
const _txHistory = [];
const _eventListeners = {
    account: new Set(),
    tx: new Set()
};

// Utils
function parseJsonFromBytes(bytes) {
    try {
        return JSON.parse(Buffer.from(bytes).toString());
    } catch (e) {
        return null;
    }
}

async function queryRpc(method, params) {
    const response = await fetch(_config.nodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: `fastnear-${Date.now()}`,
            method,
            params
        })
    });

    const result = await response.json();
    if (result.error) {
        throw new Error(`RPC Error: ${result.error.message}`);
    }
    return result.result;
}

// Event Notifiers
function notifyAccountListeners(accountId) {
    _eventListeners.account.forEach(callback => callback(accountId));
}

function notifyTxListeners(tx) {
    _eventListeners.tx.forEach(callback => callback(tx));
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
        if (!_accountId) return 'SignedOut';
        // TODO: Check for limited access key
        return 'SignedIn';
    },

    // Query Methods
    async view({ contract, method, args, blockId }) {
        const argsBase64 = args ? Buffer.from(JSON.stringify(args)).toString('base64') : '';
        
        const result = await queryRpc('query', {
            request_type: 'call_function',
            finality: blockId === 'final' ? 'final' : 'optimistic',
            account_id: contract,
            method_name: method,
            args_base64: argsBase64
        });

        return parseJsonFromBytes(result.result);
    },

    async account({ accountId, blockId }) {
        return queryRpc('query', {
            request_type: 'view_account',
            finality: blockId === 'final' ? 'final' : 'optimistic',
            account_id: accountId
        });
    },

    async block({ blockId }) {
        return queryRpc('block', { block_id: blockId });
    },

    async accessKey({ accountId, publicKey, blockId }) {
        return queryRpc('query', {
            request_type: 'view_access_key',
            finality: blockId === 'final' ? 'final' : 'optimistic',
            account_id: accountId,
            public_key: publicKey
        });
    },

    async tx({ txHash, accountId }) {
        return queryRpc('tx', [txHash, accountId]);
    },

    localTxHistory() {
        return [..._txHistory];
    },

    // Transaction Methods
    async sendTx({ receiverId, actions, ...rest }) {
        if (!_accountId) throw new Error('Not signed in');

        const accessKey = await this.accessKey({
            accountId: _accountId,
            publicKey: _publicKey
        });

        const block = await this.block({ blockId: 'final' });

        const txHash = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const txStatus = {
            id: txHash,
            signerId: _accountId,
            receiverId,
            actions,
            status: 'pending',
            timestamp: Date.now(),
            ...rest
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
        functionCall: ({ methodName, gas, deposit, args }) => ({
            type: 'FunctionCall',
            params: {
                method_name: methodName,
                args: args ? Buffer.from(JSON.stringify(args)).toString('base64') : '',
                gas: gas || '30000000000000',
                deposit: deposit || '0'
            }
        }),

        transferNEAR: (amount) => ({
            type: 'Transfer',
            params: { deposit: amount }
        }),

        transferYoctoNEAR: (yoctoAmount) => ({
            type: 'Transfer',
            params: { deposit: yoctoAmount.toString() }
        }),

        transferFt: ({ receiverId, ftContract, amount, memo }) => ({
            type: 'FunctionCall',
            params: {
                method_name: 'ft_transfer',
                args: Buffer.from(JSON.stringify({ 
                    receiver_id: receiverId, 
                    amount, 
                    memo 
                })).toString('base64'),
                gas: '30000000000000',
                deposit: '1'
            }
        }),

        stakeNEAR: ({ amount, publicKey }) => ({
            type: 'Stake',
            params: { stake: amount, public_key: publicKey }
        }),

        unstakeNEAR: ({ amount }) => ({
            type: 'Stake',
            params: { stake: '0' }
        }),

        addFullAccessKey: ({ publicKey }) => ({
            type: 'AddKey',
            params: { 
                public_key: publicKey, 
                access_key: { permission: 'FullAccess' } 
            }
        }),

        addLimitedAccessKey: ({ publicKey, allowance, accountId, methodNames }) => ({
            type: 'AddKey',
            params: {
                public_key: publicKey,
                access_key: {
                    permission: {
                        FunctionCall: {
                            allowance,
                            receiver_id: accountId,
                            method_names: methodNames
                        }
                    }
                }
            }
        }),

        deleteKey: ({ publicKey }) => ({
            type: 'DeleteKey',
            params: { public_key: publicKey }
        }),

        deleteAccount: ({ beneficiaryId }) => ({
            type: 'DeleteAccount',
            params: { beneficiary_id: beneficiaryId }
        }),

        createAccount: () => ({
            type: 'CreateAccount',
            params: {}
        }),

        deployContract: ({ code }) => ({
            type: 'DeployContract',
            params: { code }
        })
    }
};

// Handle wallet redirect if applicable
// TODO: Implement actual wallet integration
try {
    const url = new URL(window.location.href);
    const accountId = url.searchParams.get('account_id');
    const publicKey = url.searchParams.get('public_key');
    const errorCode = url.searchParams.get('error_code');
    
    if (errorCode) {
        throw new Error(`Wallet error: ${errorCode}`);
    }
    
    if (accountId && publicKey) {
        _accountId = accountId;
        _publicKey = publicKey;
        notifyAccountListeners(accountId);
    }
} catch (e) {
    console.error('Error handling wallet redirect:', e);
}

// Export as global object
window.near = api;

export default api;