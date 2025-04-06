import { Worker, isMainThread, workerData } from 'worker_threads';
import { Ed25519Keypair } from '@mysten/sui.js';
import bip39 from 'bip39';
import fs from 'fs';

const TOTAL_WALLETS = 1000;
const THREAD_COUNT = 50;
const WALLETS_PER_THREAD = TOTAL_WALLETS / THREAD_COUNT;
fs.writeFileSync('address.txt', '', 'utf8');
fs.writeFileSync('mnemonic.txt', '', 'utf8');
fs.writeFileSync('key.txt', '', 'utf8');

if (isMainThread) {
  for (let i = 0; i < THREAD_COUNT; i++) {
    const startIndex = i * WALLETS_PER_THREAD;
    const endIndex = startIndex + WALLETS_PER_THREAD;
    new Worker(new URL(import.meta.url), {
      workerData: { startIndex, endIndex }
    });
  }
} else {
  const { startIndex, endIndex } = workerData;

  for (let i = startIndex; i < endIndex; i++) {
    const mnemonic = bip39.generateMnemonic();
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);
    const address = keypair.getPublicKey().toSuiAddress();
    const exportedKeypair = keypair.export();
    const privateKeyBase64 = exportedKeypair.privateKey;
    const privateKeyHex = Buffer.from(privateKeyBase64, 'base64').toString('hex');
    console.log(`Sui Address: ${address}`);
    console.log(`Mnemonic: ${mnemonic}`);
    console.log(`Private Key (hex): ${privateKeyHex}`);
    console.log('-'.repeat(80));
    fs.appendFileSync('address.txt', `${address}\n`, 'utf8');
    fs.appendFileSync('mnemonic.txt', `${mnemonic}\n`, 'utf8');
    fs.appendFileSync('key.txt', `${privateKeyHex}\n`, 'utf8');
  }
}
