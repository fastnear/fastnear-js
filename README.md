# FastNear JS

FastNear is a JavaScript library that allows you to interact with the NEAR blockchain. It is designed to be fast, lightweight, and easy to use.

## Interface

Global object `window.near` is available after including the library. It has the following methods:

Context:

`near.accountId` - getter

`near.config({...})` - either getter or setter

`near.authStatus -> SignedIn | SignedOut | SignedInWithLimitedAccessKey(AccessKey)` - getter

Queries:

`near.view({ contract, method, args, argsBase64, blockId }): Promise<any>`
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

// The ammount should be a string in yoctoNEAR
`near.actions.transfer(amount: string): Action`

`near.actions.transferFt({ receiverId, ftContract, amount, memo }): Action`

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

### Example:

```jsx
near.config({ networkId: "testnet" });

near.onAccount((accountId) => {
  console.log("Account changed to", accountId);
});

near.onTx((txStatus) => {
  console.log("Transaction status changed", txStatus);
});

return <div>
  {near.accountId ?
    <div key="sign-out">
      <h1>Logged in as {near.accountId}</h1>
      <button onClick={() => near.signOut()}>Sign Out</button>
    </div>
    : 
    <div key="sign-in">
      <button onClick={() => near.requestSignIn({ contractId: "example.testnet" })}>Sign In</button>
    </div>
  }
  
  <button onClick={() => near.sendTx({
    receiverId: "example.testnet",
    actions: [
      near.actions.functionCall({
        methodName: "hello",
        gas: $$`100 Tgas`,
        deposit: "0",
        args: { name: "Alice" }
      })
    ]
  })}>Send Hello</button>
</div>;

```
