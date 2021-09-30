# T2Lib

Official Trinci 2 SDK JavaScript library

## Description

This library allows to interact with Trinci nodes and eases the creation, use, management and transcoding of accounts, keys, transactions, connections and everything else needed to successfully operate on a TRINCI blockchain network.

It works server side (`cjs` and `module` support) as well as in browsers. This allows you to manage your accounts ang send transactions directly from a browser avoiding third services altogether. Note that cryptographic part of this library relies on Webcrypto and needs for a browser to support in in order to be fully functional.

## Examples

```javascript
import t2lib from '@affidaty/t2lib';
// CommonJS also works:
// const t2lib = require('@affidaty/t2lib');

// account generation
const acc = new Account();
await acc.generate();

//keys export/import and interactions
const acc = new t2lib.Account();
await acc.generate();
const pubKey = acc.keyPair.publicKey;
const pubKeyRaw = await acc.keyPair.publicKey.getRaw();
const pubKeySPKI = await pubKey.getSPKI();
const keyPair1 = acc.keyPair;
await keyPair1.publicKey.setRaw(pubKeyRaw);

const keyPair2 = new t2lib.ECDSAKeyPair();
await keyPair2.publicKey.setSPKI(pubKeySPKI);
keyPair2.privateKey = acc.keyPair.privateKey;
const acc2 = new Account();
await acc2.setKeyPair(keyPair2);
console.log(acc2.accountId);

// mint transaction example
const basicAssetSc = new Uint8Array(Buffer.from('122018086245b6ac31b4b71a3c3c7aa57964052741873d8b93e876f883694feaed48', 'hex'));
const defaultNetworkName = 'skynet';
const nonce = new Uint8Array(8);
await t2lib.WebCrypto.getRandomValues(nonce);

const tx = new t2lib.Transaction();
tx.setAccountId(acc1.accountId);
tx.setNonce(nonce);
tx.setNetworkName(defaultNetworkName);
tx.setSmartContractHash(basicAssetSc);
tx.setSmartContractMethod('mint');
tx.setSmartContractMethodArgs({
    to: acc2.accountId,
    units: 1,
});
await tx.sign(acc1.keyPair);
const txBytes = Buffer.from(await tx.toBytes()).toString('hex');
console.log(txBytes);
```

## Browser support

This library also works in browser. It's minified version can be found at `<pkg_install_dir>/dist/browser/t2lib.min.js`
just include it with
```html
<script src="../dist/browser/t2lib.min.js"></script>
```
and start to use it as you would with NodeJS.

## Documentation

Wiki: [T2Lib Wiki](wiki/index.md)

For a deeper insight:
   1. Clone repo ([link](https://github.com/Affidaty-spa/T2-lib.git))
   2. Install dependencies with `npm install`
   3. Generate docs with `npm run docs`
   4. Read docs in html format by opening `<repo_dir>/docs/index.html`