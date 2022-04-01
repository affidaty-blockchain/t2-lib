// IMPORTANT! A fully operational trinci node is needed to perform tests below
// also some initial configuration required
// please set the correct node url, network name and asset smart contract hash

import t2lib from '../index';

const message = t2lib.Message.stdTrinciMessages.getBlock(0, true);

describe('Testing transaction class', () => {
    // node URL
    const url = 'http://localhost:8000';
    // const url = 'http://t2.dev.trinci.net/0.2.3rc1/';
    // node network name
    const network = 'univac';
    // const network = 'breakingnet';

    const client = new t2lib.Client(url, network);

    it('test1', async () => {
        console.log(await client.blockData(0, true));
        // let testTx = new t2lib.Transaction();
        // let testTicket = await client.submitTx(testTx);
        // let testReceipt = await client.waitForTicket(testTicket);
        // console.log(`SUCCESS: ${testReceipt.success}`);
        // if (testReceipt.success) {
        //     console.log('RESULT:');
        //     console.log(t2lib.Utils.bytesToObject(testReceipt.result));
        // } else {
        //     console.log(`ERROR: [${t2lib.binConversions.arrayBufferToString(testReceipt.result.buffer)}]`);
        // }
    }, 30000);
});
