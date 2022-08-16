import t2lib from '../index';

describe('Testing transaction classes', () => {
    const nodeUrl = 'https://testnet.trinci.net';
    const nodeNet = '<not really important in this case>';
    const client = new t2lib.Client(nodeUrl, nodeNet);
    let firstTxTicket: string = '';

    it('getting service account data', async () => {
        const accData = await client.accountData('TRINCI', []);
        expect(accData.accountId).toEqual('TRINCI');
        expect(accData.contractHash).not.toBeNull();
        expect(accData.contractHash!.startsWith('1220', 0)).toBeTruthy();
    }, 30000);

    it('getting genesis block data', async () => {
        const blockData = await client.blockData(0, true);
        expect(blockData.info.idx).toEqual(0);
        expect(blockData.info.prevHash).toEqual('0000');
        expect(blockData.tickets.length).toBeGreaterThan(0);
        firstTxTicket = blockData.tickets[0];
    }, 30000);

    it('get first tx data and receipt', async () => {
        const txReceipt = await client.txReceipt(firstTxTicket);
        expect(txReceipt.success).toBeTruthy();
        const txData = await client.txData(firstTxTicket);
        expect(await txData.verify()).toBeTruthy();
    }, 30000);
});
