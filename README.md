# FastNear JS

FastNear is a JavaScript library that allows you to interact with the NEAR blockchain. It is designed to be fast, lightweight, and easy to use.

## Interface

Global object `window.Near` is available after including the library. It has the following methods:

Context:

`Near.accountId` - getter

`Near.config({...})` - either getter or setter

`Near.authStatus -> SignedIn | SignedOut | SignedInWithLimitedAccessKey(AccessKey)` - getter

Queries:

`Near.view({ contract, method, args, argsBase64, blockId }): Promise<any>`
- `blockId` is optional and can be either a block hash, a block height or finality (`final` or `optimistic`)

`Near.account({ accountId, blockId }): Promise<Account>`

`Near.block({ blockId }): Promise<Block>`

`Near.accessKey({ accountId, publicKey, blockId }): Promise<AccessKey>`

`Near.tx({ txId }): Promise<Tx>`

`Near.localTxHistory(): TxStatus[]` - returns the list of transactions that were locally issued by this application.

Sending transactions:

`Near.sendTx({ receiverId, actions, ... }): Promise<LocalTransactionId>`
- returns the local transaction ID that can be used to track the transaction status using `localTxHistory`

Helper methods to construct action objects:

`Near.actions.functionCall({ methodName, gas, deposit, args, argsBase64 }): Action`

`Near.actions.transferNEAR(amount: string): Action`

`Near.actions.transferYoctoNEAR(yoctoAmount: number): Action`

`Near.actions.transferFt({ receiverId, ftContract, amount, memo }): Action`

`Near.actions.stakeNEAR({ amount, publicKey }): Action`

`Near.actions.unstakeNEAR({ amount }): Action`

`Near.actions.addFullAccessKey({ publicKey }): Action`

`Near.actions.addLimitedAccessKey({ publicKey, allowance, accountId, methodNames }): Action`

`Near.actions.deleteKey({ publicKey }): Action`

`Near.actions.deleteAccount({ beneficiaryId }): Action`

`Near.actions.createAccount(): Action`

`Near.actions.deployContract({ code }): Action`

Authenticating:

`Near.requestSignIn({ contractId }): Promise<void>`

`Near.signOut()`

Events:

`Near.onAccount((accountId: AccountId) => {})`
- called when the account changes

`Near.onTx((txStatus: TxStatus) => {})`
- called when a transaction status changes locally or remotely. E.g. you sent a new transaction, or a transaction that you sent was confirmed.

