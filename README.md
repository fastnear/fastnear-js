# FastNear JS

FastNear is a JavaScript library that allows you to interact with the NEAR blockchain. It is designed to be fast, lightweight, and easy to use.

## TODO

- Tests
  - [ ] Test injected Meteor wallet
  - [ ] Test sign in without a contractID
  - [ ] Test all actions
  - [ ] 

- FastNear
  - [ ] Support testnet
    - [ ] Remember the network ID in the local storage state.
  - [ ] More examples
    - [ ] Hello world (just a view call read-only)
    - [ ] Sign in
      - [ ] With contract ID
      - [ ] Without contract ID
  - [ ] Documentation below
  - [ ] Send multiple transactions
- Wallet Adapter
  - [ ] Redirect to wallet should be there
  - [ ] Store its own state in the local storage
  - [ ] Handle URL after redirect (for my near wallet)
  - [ ] Add sign out method
  - [ ] Take RPC URL from the config (pass to widget)
- Wallet Adapter Widget
  - [ ] Single transaction API instead of using `sendTransactions`, because wallets are sooo bad.
  - [ ] Improve Meteor button UI. Also don't show button if it's injected.
  - [ ] Sign out page to handle Meteor sign out flow.
  - [ ] Ask HERE why they don't use public key for sign in?
  - [ ] Take RPC URL from the wallet adapter
  - [ ] Delegate Action maybe not supported. Check.
  - [ ] Add more wallets
    - [ ] MetaMask
    - [ ] Bitte
    - [ ] Near Mobile
    - [ ] Telegram auto sign in with injection from Here



## Interface

Global object `window.near` is available after including the library. It has the following methods:

Context:

`near.accountId` - getter

`near.config({...})` - either getter or setter

`near.authStatus -> SignedIn | SignedOut | SignedInWithLimitedAccessKey(AccessKey)` - getter

Queries:

`near.view({ contractId, methodName, args, argsBase64, blockId }): Promise<any>`
- `blockId` is optional and can be either a block hash, a block height or finality (`final` or `optimistic`)

`near.account({ accountId, blockId }): Promise<Account>`

`near.block({ blockId }): Promise<Block>`

`near.accessKey({ accountId, publicKey, blockId }): Promise<AccessKey>`

`near.tx({ txId }): Promise<Tx>`

`near.localTxHistory(): TxStatus[]` - returns the list of transactions that were locally issued by this application.

Sending transactions:

`near.sendTx({ receiverId, actions, ... }): Promise<LocalTransactionId>`
- returns the local transaction ID that can be used to track the transaction status using `localTxHistory`

Helper methods to construct action objects:

`near.actions.functionCall({ methodName, gas, deposit, args, argsBase64 }): Action`

// The amount should be a string in yoctoNEAR
`near.actions.transfer(amount: string): Action`

`near.actions.stakeNEAR({ amount, publicKey }): Action`

`near.actions.unstakeNEAR({ amount }): Action`

`near.actions.addFullAccessKey({ publicKey }): Action`

`near.actions.addLimitedAccessKey({ publicKey, allowance, accountId, methodNames }): Action`

`near.actions.deleteKey({ publicKey }): Action`

`near.actions.deleteAccount({ beneficiaryId }): Action`

`near.actions.createAccount(): Action`

`near.actions.deployContract({ code }): Action`

Authenticating:

`near.requestSignIn({ contractId }): Promise<void>`

`near.signOut()`

Events:

`near.onAccount((accountId: AccountId) => {})`
- called when the account changes

`near.onTx((txStatus: TxStatus) => {})`
- called when a transaction status changes locally or remotely. E.g. you sent a new transaction, or a transaction that you sent was confirmed.

```
