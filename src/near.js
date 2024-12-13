import { Near as NearApi } from "near-api-js";

const near = new NearApi({
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  keyStore: new NearWalletAccount
});

const sendTransaction = async (transaction) => {
  // TODO
};


export const Near = {

};
