import t2lib from '../index';

describe('Testing transaction classes', () => {
    const nodeUrl = 'https://testnet.trinci.net';
    const nodeNet = '<NetworkId>'; // doesn't matter in this specific case
    const client = new t2lib.Client(nodeUrl, nodeNet);
    let firstTxTicket: string = '';

    it('testing timeout (200ms)', async () => {
        const wrongNodeUrl = 'https://testnet.trinci.net:8000';
        const wrongClient = new t2lib.Client(wrongNodeUrl, nodeNet);
        wrongClient.timeout = 200;
        await expect(wrongClient.accountData('TRINCI', [])).rejects.toThrow('Error: Request aborted.');
    }, 30000);

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
