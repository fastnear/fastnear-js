import { Buffer } from 'buffer';
import process from 'process';
import { Near } from "near-api-js";

window.Buffer = Buffer;
window.process = process;

const near = new Near({
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    keyStore: new NearWalletAccount
});

export const sendTransaction = async (transaction) => {
    // TODO
};
