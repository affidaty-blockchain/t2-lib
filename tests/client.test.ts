// IMPORTANT! A fully operational trinci node is needed to perform tests below
// also some initial configuration required
// please set the correct node url, network name and asset smart contract hash
import util from 'util';

import { Account } from '../src/account';
import { Transaction } from '../src/transaction';
import { stdTxPrepareUnsigned } from '../src/stdTxPrepareUnsigned';
import { Client } from '../src/client';

describe('Testing transaction class', () => {
    // Asset smart contract hash
    const assetSc = '1220183aeeb591efe03a1f9513342ecfa733cde08dbd8f477a3a7e2b7b8c764f690a';
    // node URL
    const url = 'http://localhost:8000/';
    // node network name
    const network = 'skynet';

    const client = new Client(url, network);

    if (url.length === 0 || network.length === 0) {
        console.log('Please, provide a trinci node URL and network name');
    }

    it('test1', async () => {
        let receipt = await client.txReceipt('12207d59a632efe7cb972919eb55618009dd83cb7aec70efcb6186eb302817be0472');
        console.log(util.inspect(receipt, {showHidden: false, depth: null, colors: true}));
    }, 30000);
});
