// IMPORTANT! A fully operational trinci node is needed to perform tests below
// also some initial configuration required
// please set the correct node url, network name and asset smart contract hash

import { Account } from '../src/account';
import { Transaction } from '../src/transaction';
import { stdTxPrepareUnsigned } from '../src/stdTxPrepareUnsigned';
import { Client } from '../src/client';

describe('Testing transaction class', () => {
    // Asset smart contract hash
    const assetSmartContractHash = '1220ea1ccb01d6f36dfef8269e3c7d62858f2dff2b8ebc91d32981333d72faf0947d';
    // node URL
    const url = '';
    // node network name
    const network = '';

    const client = new Client(url, network);

    if (url.length === 0 || network.length === 0) {
        /* eslint-disable-next-line no-console */
        console.log('Please, provide a trinci node URL and network name');
    }

    it('test1', async () => {
        expect(url.length).not.toEqual(0);
        expect(network.length).not.toEqual(0);
        const nonExistAcc = new Account();
        await nonExistAcc.generate();
        await expect(client.accountData(nonExistAcc)).rejects.toBeDefined();

        const acc1 = new Account();
        await acc1.generate();

        const blockData = await client.blockData(0, true);
        expect(blockData!.info.prevHash).toEqual('0000');

        const contractsList = await client.registeredContractsList();
        const contractsListKeys = Object.keys(contractsList);
        expect(contractsListKeys.length).toBeGreaterThan(0);

        const assetAcc = new Account();
        await assetAcc.generate();
        const assetInitTx = stdTxPrepareUnsigned.asset.init(
            assetAcc.accountId,
            client.network,
            assetSmartContractHash,
            {
                name: 'newAsset',
                description: 'This is a new test asset.',
                url: 'https://www.my.domain.com/',
                max_units: 10000,
                authorized: [],
            },
        );
        await assetInitTx.sign(assetAcc.keyPair.privateKey);
        const initTicket = await client.signAndSubmitTx(assetInitTx, assetAcc.keyPair.privateKey);
        const initReceipt = await client.waitForTicket(initTicket, 10, 1000);
        expect(initReceipt.success).toBeTruthy();

        const assetStatsTx = stdTxPrepareUnsigned.asset.stats(
            assetAcc.accountId,
            client.network,
        );
        const statsTicket = await client.signAndSubmitTx(assetStatsTx, assetAcc.keyPair.privateKey);
        const statsReceipt = await client.waitForTicket(statsTicket, 10, 1000);
        expect(statsReceipt.success).toBeTruthy();

        const mintTicket = await client.prepareAndSubmitTx(
            assetAcc.accountId,
            '',
            'mint',
            {
                to: acc1.accountId,
                units: 50,
            },
            assetAcc.keyPair.privateKey,
        );

        const mintTx = await client.txData(mintTicket);
        await expect(mintTx.verify()).resolves.toEqual(true);
        expect(mintTx.smartContractMethod).toEqual('mint');

        const mintReceipt = await client.waitForTicket(mintTicket, 10, 1000);
        expect(mintReceipt.success).toBeTruthy();

        const accountData = await client.accountData(acc1);
        const accountAssets = Object.keys(accountData!.assets);
        expect(accountAssets.indexOf(assetAcc.accountId)).not.toEqual(-1);

        // Uncomment following lines to test asset registration
        // const assetRegTx = stdTxPrepareUnsigned.service.asset_registration(
        //     defServiceAccountID,
        //     client.network,
        //     {
        //         id: assetAcc.accountId,
        //         name: 'testAsset',
        //         url: 'https://www.example.com/',
        //         contract: basicAssetSc,
        //     },
        // );
        // await assetRegTx.sign(assetAcc.keyPair.privateKey);
        // const regTicket = await client.signAndSubmitTx(assetRegTx, assetAcc.keyPair.privateKey);
        // const regReceipt = await client.waitForTicket(regTicket, 10, 1000);
        // expect(regReceipt.success).toBeTruthy();

        const assetsList = await client.registeredAssetsList();
        const assetsListKeys = Object.keys(assetsList);
        expect(assetsListKeys.length).toBeGreaterThan(0);

        const txArray: Transaction[] = [];
        for (let i = 0; i < 5; i += 1) {
            txArray.push(await client.prepareTx(
                assetAcc.accountId,
                '',
                'mint',
                {
                    to: acc1.accountId,
                    units: 50,
                },
                assetAcc.keyPair.privateKey,
            ));
        }

        const ticketArray = await client.submitTxArray(txArray);
        const receiptArray = await client.waitForTicketArray(ticketArray);
        for (let i = 0; i < receiptArray.length; i += 1) {
            expect(receiptArray[i]!).toBeTruthy();
        }
    }, 30000);
});
