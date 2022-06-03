import net from 'net';
import EventsLib from 'events';
import * as Errors from './errors';
import { IS_BROWSER } from './browser';
import { removeValuefromArray } from './utils';
import { mKeyPairParams, EKeyParamsIds } from './cryptography/cryptoDefaults';
import {
    TrinciMessage,
    MessageTypes,
    TSubscribeEventType,
    stdTrinciMessages,
} from './messageFormat';
import { SERVICE_ACCOUNT_ID as defServiceAccountID } from './systemDefaults';
import { BaseECKey } from './cryptography/baseECKey';
import { Transaction as TransactionClass } from './transaction/transaction';
import {
    Client,
    IBlockData,
    ITxReceiptData,
    ITxEvent,
} from './client';

export type TBridgeEventNameType = 'connect' | 'ready' | 'close' | 'error' | 'timeout' | 'data' | 'message' | 'transaction' | 'block' | 'txevent';

/**
 * Default TCP socket client to query a TRINCI node.
 * Available only in Node.js environment.
 */
export class BridgeClient extends Client {
    private _maxMsgLength: number = 0xffffffff;

    private _recBuffer: Buffer = Buffer.from([]);

    private _eventEmitter = new EventsLib.EventEmitter();

    private _subscribedToBlocks: boolean = false;

    private _wantedTickets: string[] = [];

    socket: net.Socket;

    hostname: string;

    bridgePort: number;

    connected: boolean = false;

    constructor(
        baseUrl: string = '',
        restPort: number = 8000,
        bridgePort: number = 8001,
        networkName: string = 'bootstrap',
        customServiceAcc: string = defServiceAccountID,
    ) {
        if (IS_BROWSER) {
            throw Error(Errors.NO_BRIDGE_IN_BROWSER);
        }
        const url = new URL(baseUrl);
        let hostname = '';
        let protocol = 'http:';
        if (url.hostname.length < 1) {
            if (url.protocol.length < 1) {
                throw Errors.INVALID_HOSTNAME;
            }
            hostname = url.protocol.slice(0, -1);
        } else {
            protocol = url.protocol;
            hostname = url.hostname;
        }
        super(`${protocol}//${hostname}:${restPort}`, networkName, customServiceAcc);
        this.hostname = hostname;
        this.bridgePort = bridgePort;
        this.socket = new net.Socket();
        this.socket.on('connect', () => {
            this._eventEmitter.emit('connect');
        });
        this.socket.on('ready', () => {
            this.connected = true;
            this._eventEmitter.emit('ready');
        });
        this.socket.on('end', () => {
            this.socket.end();
        });
        this.socket.on('close', (hadError) => {
            this.connected = false;
            this._eventEmitter.emit('close', (hadError));
        });
        this.socket.on('error', (error) => {
            this._eventEmitter.emit('error', (error));
        });
        this.socket.on('timeout', () => {
            this._eventEmitter.emit('timeout');
        });
        this.socket.on('data', (recData: Buffer) => {
            this._eventEmitter.emit('data', (recData));
            this._recBuffer = Buffer.concat([
                this._recBuffer,
                recData,
            ]);
            /* eslint-disable-next-line no-constant-condition */
            while (true) {
                if (this._recBuffer.byteLength < 4) {
                    break;
                }
                const msgSize = new Uint32Array(
                    new Uint8Array(
                        this._recBuffer.subarray(0, 4),
                    ).reverse().buffer,
                )[0];
                if (this._recBuffer.byteLength < 4 + msgSize) {
                    break;
                }
                const msg = new TrinciMessage();
                let validMsg = true;
                try {
                    msg.fromBytes(this._recBuffer.subarray(4));
                } catch (error) {
                    validMsg = false;
                }
                this._recBuffer = this._recBuffer.subarray(4 + msgSize);
                if (validMsg) {
                    this._eventEmitter.emit('message', (msg));
                }
            }
        });
        this.on('message', async (msg: TrinciMessage) => {
            switch (msg.type) {
                case MessageTypes.GetTransactionResponse: {
                    const tx = new TransactionClass();
                    await tx.fromUnnamedObject(msg.body.tx);
                    this._eventEmitter.emit('transaction', (tx));
                    break;
                }
                case MessageTypes.GetBlockResponse: {
                    let signerKeyParamsId: string = msg.body.blockInfo[0][0][0];
                    if (msg.body.blockInfo[0][0][1].length > 0) {
                        signerKeyParamsId += `_${msg.body.blockInfo[0][0][1]}`;
                    }
                    if (!mKeyPairParams.has(signerKeyParamsId)) {
                        throw new Error(Errors.IMPORT_TYPE_ERROR);
                    }
                    const blockDataObj: IBlockData = {
                        info: {
                            signer: new BaseECKey(
                                mKeyPairParams.get(signerKeyParamsId)!.publicKey,
                            ),
                            idx: msg.body.blockInfo[0][1],
                            txCount: msg.body.blockInfo[0][2],
                            prevHash: Buffer.from(msg.body.blockInfo[0][3]).toString('hex'),
                            txsRoot: Buffer.from(msg.body.blockInfo[0][4]).toString('hex'),
                            receiptsRoot: Buffer.from(msg.body.blockInfo[0][5]).toString('hex'),
                            accountsRoot: Buffer.from(msg.body.blockInfo[0][6]).toString('hex'),
                        },
                        signature: new Uint8Array(msg.body.blockInfo[1]),
                        tickets: [],
                    };
                    for (let i = 0; i < msg.body.ticketList.length; i += 1) {
                        blockDataObj.tickets.push(Buffer.from(msg.body.ticketList[i]).toString('hex'));
                    }
                    if (signerKeyParamsId === EKeyParamsIds.EMPTY) {
                        this._eventEmitter.emit('block', (blockDataObj));
                        return;
                    }
                    blockDataObj.info.signer.setRaw(msg.body.blockInfo[0][0][2])
                        .then((result: boolean) => {
                            if (!result) {
                                throw new Error('Key import returned false.');
                            }
                            this._eventEmitter.emit('block', (blockDataObj));
                        })
                        .catch((error: any) => {
                            throw new Error(error);
                        });
                    break;
                }
                case MessageTypes.TransactionEvent: {
                    const scEventObj: ITxEvent = {
                        eventTx: Buffer.from(msg.body.eventDataArray[0]).toString('hex'),
                        emitterAccount: msg.body.eventDataArray[1],
                        emitterSmartContract: Buffer.from(msg.body.eventDataArray[2]).toString('hex'),
                        eventName: msg.body.eventDataArray[3],
                        eventData: new Uint8Array(msg.body.eventDataArray[4]),
                    };
                    this._eventEmitter.emit('txevent', (scEventObj));
                    break;
                }
                default:
                    break;
            }
        });
        this.on('block', (blockData: IBlockData) => {
            for (let blkTktIdx = 0; blkTktIdx < blockData.tickets.length; blkTktIdx += 1) {
                if (this._wantedTickets.indexOf(blockData.tickets[blkTktIdx]) >= 0) {
                    this._eventEmitter.emit(`receipt-${blockData.tickets[blkTktIdx]}`);
                    this._wantedTickets = removeValuefromArray(
                        this._wantedTickets,
                        blockData.tickets[blkTktIdx],
                    );
                }
            }
        });
    }

    /* eslint-disable no-dupe-class-members */
    on(eventName: 'connect', eventHandler: () => any): void;

    on(eventName: 'ready', eventHandler: () => any): void;

    on(eventName: 'close', eventHandler: (hadError: boolean) => any): void;

    on(eventName: 'error', eventHandler: (error: Error) => any): void;

    on(eventName: 'timeout', eventHandler: () => any): void;

    on(eventName: 'data', eventHandler: (data: Buffer) => any): void;

    on(eventName: 'message', eventHandler: (message: TrinciMessage) => any): void;

    on(eventName: 'transaction', eventHandler: (message: TransactionClass) => any): void;

    on(eventName: 'block', eventHandler: (block: IBlockData) => any): void;

    on(eventName: 'txevent', eventHandler: (txEvent: ITxEvent) => any): void;

    on(eventName: TBridgeEventNameType, eventHandler: (...args: any[]) => any) {
        this._eventEmitter.on(eventName, eventHandler);
    }
    /* eslint-enable no-dupe-class-members */

    /* eslint-disable no-dupe-class-members */
    once(eventName: 'connect', eventHandler: () => any): void;

    once(eventName: 'ready', eventHandler: () => any): void;

    once(eventName: 'close', eventHandler: (hadError: boolean) => any): void;

    once(eventName: 'error', eventHandler: (error: Error) => any): void;

    once(eventName: 'timeout', eventHandler: () => any): void;

    once(eventName: 'data', eventHandler: (data: Buffer) => any): void;

    once(eventName: 'message', eventHandler: (message: TrinciMessage) => any): void;

    once(eventName: 'transaction', eventHandler: (message: TransactionClass) => any): void;

    once(eventName: 'block', eventHandler: (block: IBlockData) => any): void;

    once(eventName: 'txevent', eventHandler: (txEvent: ITxEvent) => any): void;

    once(eventName: TBridgeEventNameType, eventHandler: (...args: any[]) => any) {
        this._eventEmitter.once(eventName, eventHandler);
    }
    /* eslint-enable no-dupe-class-members */

    connectSocket():Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                return resolve();
            }
            const errListener = (err: any) => {
                reject(err);
            };
            this.socket.prependOnceListener('error', errListener);
            this.socket.prependOnceListener('ready', () => {
                this.socket.removeListener('error', errListener);
                resolve();
            });
            this.socket.connect(this.bridgePort, this.hostname);
        });
    }

    closeSocket(): Promise<void> {
        return new Promise((resolve) => {
            let clearCloseListener = () => {};

            const closeTimeout = setTimeout(() => {
                clearCloseListener();
                this.socket.destroy();
                return resolve();
            }, 2000);

            const closeListener = () => {
                clearTimeout(closeTimeout);
                return resolve();
            };

            clearCloseListener = () => {
                this.socket.removeListener('close', closeListener);
            };

            this.socket.prependOnceListener('close', closeListener);
            this.socket.end();
        });
    }

    writeBytes(msgBytes: Uint8Array): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Bridge not connected.'));
            }
            if (!this.socket.writable) {
                reject(new Error('Socket not writable.'));
            }
            if (msgBytes.byteLength > this._maxMsgLength) {
                reject(new Error('Max message length exceeded.'));
            }
            const lengthBytes = new Uint8Array(
                new Uint32Array(
                    [msgBytes.byteLength],
                ).buffer,
            ).reverse();
            const errListener = (err: Error) => {
                reject(err);
            };
            const drainListener = () => {
                return resolve();
            };
            this.socket.prependOnceListener('error', errListener);
            this.socket.prependOnceListener('drain', drainListener);
            const fullBytes = new Uint8Array(lengthBytes.byteLength + msgBytes.byteLength);
            fullBytes.set(lengthBytes);
            fullBytes.set(msgBytes, lengthBytes.byteLength);
            const writeSuccess = this.socket.write(fullBytes);
            if (writeSuccess) {
                this.socket.removeListener('drain', drainListener);
                return drainListener();
            }
        });
    }

    writeMessage(message: TrinciMessage): Promise<void> {
        return this.writeBytes(message.toBytes());
    }

    subscribe(connectionId: string, events: TSubscribeEventType[]): Promise<void> {
        const message = stdTrinciMessages.subscribe(connectionId, events);
        if (events.indexOf('block') >= 0) {
            this._subscribedToBlocks = true;
        }
        return this.writeMessage(message);
    }

    unsubscribe(connectionId: string, events: TSubscribeEventType[]): Promise<void> {
        const message = stdTrinciMessages.unsubscribe(connectionId, events);
        if (events.indexOf('block') >= 0) {
            this._subscribedToBlocks = false;
        }
        return this.writeMessage(message);
    }

    waitForTicket(ticket: string, timeoutMs: number = 0): Promise<ITxReceiptData> {
        return new Promise((resolve, reject) => {
            // first check if the receipt is already present
            this.txReceipt(ticket)
                .then((result) => {
                    return resolve(result);
                })
                .catch((txReceiptErr) => {
                    // reject if the error is of any type other than 'not found'
                    if (txReceiptErr.message.indexOf('resource not found') === -1) {
                        return reject(txReceiptErr);
                    }
                    // otherwise, check if the transaction is known to the node
                    this.txData(ticket)
                        .then(() => {
                            if (!this._subscribedToBlocks) {
                                return reject(new Error(Errors.NOT_SUB_TO_BLOCKS));
                            }
                            let timeoutReject = () => {};
                            const t = setTimeout(timeoutReject, timeoutMs);
                            const recEventName = `receipt-${ticket}`;
                            this._wantedTickets.push(ticket);
                            const receiptListener = () => {
                                clearTimeout(t);
                                this.txReceipt(ticket)
                                    .then((receipt) => {
                                        return resolve(receipt);
                                    })
                                    .catch((receiptErr) => {
                                        return reject(receiptErr);
                                    });
                            };
                            // actually define the timeout reject function only
                            // if the timeout is set. Otherwise it will do nothing.
                            if (timeoutMs) {
                                timeoutReject = () => {
                                    // eslint-disable-next-line max-len
                                    this._eventEmitter.removeListener(recEventName, receiptListener);
                                    return reject(new Error(`Tx ${ticket} not executed in time`));
                                };
                            }
                            this._eventEmitter.once(recEventName, receiptListener);
                        })
                        .catch((txDataErr) => {
                            if (txDataErr.message.indexOf('resource not found') !== -1) {
                                return reject(new Error(Errors.UNKNOWN_TX));
                            }
                            return reject(txDataErr);
                        });
                });
        });
    }
}
