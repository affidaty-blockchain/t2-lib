import {
    BridgeClient,
    Message,
    Transaction,
    IBlockData,
    Utils,
} from '../index';

async function main() {
    const b = new BridgeClient('http://localhost', 8000, 8001);
    // console.log(await b.accountData('TRINCI'));
    b.on('ready', () => {
        console.log('Connection ready');
    });

    b.on('close', (hadError: boolean) => {
        console.log(`Connection closed with${hadError ? '' : 'out'} errors.`);
    });

    b.on('error', (err) => {
        console.log(`error event: ${err}`);
    });

    b.on('message', (msg: Message.TrinciMessage) => {
        console.log(`new message    : [${msg.typeName}]`);
    });

    b.on('transaction', async (tx: Transaction) => {
        const ticket = await tx.getTicket();
        console.log(`new transaction: [${ticket}]`);
        b.waitForTicket(ticket)
            .then((receipt) => {
                console.log('resolved');
                console.log(receipt);
            })
            .catch((err) => {
                console.log('rejected');
                console.log(err);
            });
    });

    b.on('block', (blockData: IBlockData) => {
        console.log(`new block      : [${blockData.info.idx}]`);
    });

    b.on('txevent', (txEvent) => {
        console.log('tx event:');
        console.log(txEvent);
        console.log(Utils.bytesToObject(txEvent.eventData));
    });

    await b.connectSocket();
    b.subscribe('CLIENT_TEST', ['transaction', 'block', 'contractEvents'])
        .then(() => {
            console.log('Subscribe successful');
        })
        .catch((err) => {
            console.log(`Subscribe error: ${err}`);
        });

    // const ticket = '122023d82aa75a770cd462431b97bdbe245d45e2adfd9d626cd64dc19d1e87be2474';
    // const ticket1 = '122023d82aa75a770cd462431b97bdbe245d45e2adfd9d626cd64dc19d1e87be2473';

    // b.waitForTicket(ticket)
    //     .then((receipt) => {
    //         console.log('resolved');
    //         console.log(receipt);
    //     })
    //     .catch((err) => {
    //         console.log('rejected');
    //         console.log(err);
    //     });

    // try {
    //     await b.connect();
    // } catch (error) {
    //     console.log(`connect catch: ${error}`);
    //     return;
    // }

    // try {
    //     await b.subscribe('CLIENT_1', ['transaction', 'contractEvents']);
    // } catch (error) {
    //     console.log(`subscribe catch: ${error}`);
    //     return;
    // }

    // try {
    //     await b.subscribe('CLIENT_1', ['block']);
    // } catch (error) {
    //     console.log(`subscribe catch: ${error}`);
    //     return;
    // }

    // console.log(await b.blockData(0));

    // try {
    //     await b.unsubscribe('CLIENT_1', ['block']);
    // } catch (error) {
    //     console.log(`sub catch: ${error}`);
    //     return;
    // }
    // b.close();
}

main();
