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

export type TBridgeEventNameType = 'connect' | 'reconnect' | 'ready' | 'close' | 'error' | 'timeout' | 'data' | 'message' | 'transaction' | 'block' | 'txevent';

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

    private _reconnectCounter: number = 0;

    private _maxReconnect: number = 0;

    private _reconnectDelayMs: number = 1000;

    private _keepAliveEnabled: boolean = true;

    private _keepAliveDelay: number = 1000;

    socket: net.Socket;

    host: string;

    bridgePort: number;

    connected: boolean = false;

    private _internalListeners = {
        onSocketConnect: () => {
            this._reconnectCounter = 0;
            this._eventEmitter.emit('connect');
        },
        onSocketReady: () => {
            this.connected = true;
            this._eventEmitter.emit('ready');
        },
        onSocketEnd: () => {
            this.socket.end();
        },
        onSocketClose: (hadError: boolean) => {
            this.connected = false;
            this._eventEmitter.emit('close', (hadError));
            if (this._maxReconnect < 0 || this._reconnectCounter < this._maxReconnect) {
                setTimeout(() => {
                    this.connectSocket()
                        .then(() => {
                            this._reconnectCounter += 1;
                        })
                        .catch(() => {
                            this._reconnectCounter += 1;
                        });
                }, this._reconnectDelayMs);
            }
        },
        onSocketError: (error: Error) => {
            this._eventEmitter.emit('error', (error));
        },
        onSocketTimeout: () => {
            this._eventEmitter.emit('timeout');
        },
        onSocketData: (data: Buffer) => {
            this._eventEmitter.emit('data', (data));
            // accumulate received data.
            this._recBuffer = Buffer.concat([
                this._recBuffer,
                data,
            ]);
            /* eslint-disable-next-line no-constant-condition */
            while (true) {
                // If we have received less than 4 bytes in total then don't
                // even bother processing the data
                if (this._recBuffer.byteLength < 4) {
                    break;
                }
                // First 4 bytes represent size of the message.
                const expectedMsgSize = new Uint32Array(
                    new Uint8Array(
                        this._recBuffer.subarray(0, 4),
                    ).reverse().buffer,
                )[0];
                // Once we have the size, expect the total received data to be
                // at least that size + 4(size info itself)
                if (this._recBuffer.byteLength < expectedMsgSize + 4) {
                    break;
                }
                const msg = new TrinciMessage();
                let validMsg = true;
                try {
                    msg.fromBytes((this._recBuffer.subarray(4, expectedMsgSize + 4)));
                } catch (error) {
                    validMsg = false;
                }
                // once message has been processed, remove it from the total received data
                this._recBuffer = Buffer.from(this._recBuffer.subarray(expectedMsgSize + 4));
                if (validMsg) {
                    this._eventEmitter.emit('message', (msg));
                }
            }
        },
        onTrinciMessage: async (msg: TrinciMessage) => {
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
        },
        onTrinciBlock: (blockData: IBlockData) => {
            for (let blkTktIdx = 0; blkTktIdx < blockData.tickets.length; blkTktIdx += 1) {
                if (this._wantedTickets.indexOf(blockData.tickets[blkTktIdx]) >= 0) {
                    this._eventEmitter.emit(`receipt-${blockData.tickets[blkTktIdx]}`);
                    this._wantedTickets = removeValuefromArray(
                        this._wantedTickets,
                        blockData.tickets[blkTktIdx],
                    );
                }
            }
        },
    };

    constructor(
        host: string = '',
        restPort: number = 8000,
        bridgePort: number = 8001,
        networkName: string = '',
        customServiceAcc: string = defServiceAccountID,
    ) {
        if (IS_BROWSER) {
            throw Error(Errors.NO_BRIDGE_IN_BROWSER);
        }
        const parsedUrl = new URL(host.indexOf('://') >= 0 ? host : `http://${host}`);
        const restProtocol = parsedUrl.protocol === 'https:'
            ? 'https:'
            : 'http:';
        const restHost = `${restProtocol}//${
            parsedUrl.username
                ? `${
                    parsedUrl.password
                        ? `${parsedUrl.username}:${parsedUrl.password}`
                        : `${parsedUrl.username}`
                }@`
                : ''
        }${parsedUrl.hostname}${
            // eslint-disable-next-line no-nested-ternary
            restPort
                ? `:${restPort}`
                : parsedUrl.port
                    ? `:${parsedUrl.port}`
                    : ''
        }${parsedUrl.pathname}`;
        super(restHost, networkName, customServiceAcc);
        this.host = parsedUrl.hostname;
        this.bridgePort = bridgePort;

        this.socket = new net.Socket()
            .on('connect', this._internalListeners.onSocketConnect)
            .on('ready', this._internalListeners.onSocketReady)
            .on('end', this._internalListeners.onSocketEnd)
            .on('close', this._internalListeners.onSocketClose)
            .on('error', this._internalListeners.onSocketError)
            .on('timeout', this._internalListeners.onSocketTimeout)
            .on('data', this._internalListeners.onSocketData);

        this.on('message', this._internalListeners.onTrinciMessage)
            .on('block', this._internalListeners.onTrinciBlock);
    }

    /* eslint-disable no-dupe-class-members */
    on(eventName: 'connect', eventHandler: () => any): BridgeClient;

    on(eventName: 'reconnect', eventHandler: (attempt: number) => any): BridgeClient;

    on(eventName: 'ready', eventHandler: () => any): BridgeClient;

    on(eventName: 'close', eventHandler: (hadError: boolean) => any): BridgeClient;

    on(eventName: 'error', eventHandler: (error: Error) => any): BridgeClient;

    on(eventName: 'timeout', eventHandler: () => any): BridgeClient;

    on(eventName: 'data', eventHandler: (data: Buffer) => any): BridgeClient;

    on(eventName: 'message', eventHandler: (message: TrinciMessage) => any): BridgeClient;

    on(eventName: 'transaction', eventHandler: (message: TransactionClass) => any): BridgeClient;

    on(eventName: 'block', eventHandler: (block: IBlockData) => any): BridgeClient;

    on(eventName: 'txevent', eventHandler: (txEvent: ITxEvent) => any): BridgeClient;

    on(eventName: TBridgeEventNameType, eventHandler: (...args: any[]) => any): BridgeClient {
        this._eventEmitter.on(eventName, eventHandler);
        return this;
    }
    /* eslint-enable no-dupe-class-members */

    /* eslint-disable no-dupe-class-members */
    once(eventName: 'connect', eventHandler: () => any): BridgeClient;

    once(eventName: 'reconnect', eventHandler: (attempt: number) => any): BridgeClient;

    once(eventName: 'ready', eventHandler: () => any): BridgeClient;

    once(eventName: 'close', eventHandler: (hadError: boolean) => any): BridgeClient;

    once(eventName: 'error', eventHandler: (error: Error) => any): BridgeClient;

    once(eventName: 'timeout', eventHandler: () => any): BridgeClient;

    once(eventName: 'data', eventHandler: (data: Buffer) => any): BridgeClient;

    once(eventName: 'message', eventHandler: (message: TrinciMessage) => any): BridgeClient;

    once(eventName: 'transaction', eventHandler: (message: TransactionClass) => any): BridgeClient;

    once(eventName: 'block', eventHandler: (block: IBlockData) => any): BridgeClient;

    once(eventName: 'txevent', eventHandler: (txEvent: ITxEvent) => any): BridgeClient;

    once(eventName: TBridgeEventNameType, eventHandler: (...args: any[]) => any): BridgeClient {
        this._eventEmitter.once(eventName, eventHandler);
        return this;
    }
    /* eslint-enable no-dupe-class-members */

    connectSocket(
        enableKeepAlive?: boolean,
        keepAliveDelayMs?: number,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                return resolve();
            }
            if (typeof enableKeepAlive === 'boolean') {
                this._keepAliveEnabled = enableKeepAlive;
            }
            if (typeof keepAliveDelayMs === 'number' && keepAliveDelayMs >= 0) {
                this._keepAliveDelay = keepAliveDelayMs;
            }
            let readyListener = () => {};
            const errListener = (err: any) => {
                this.socket.removeListener('ready', readyListener);
                reject(err);
            };
            readyListener = () => {
                this.socket.removeListener('error', errListener);
                resolve();
            };
            this.socket.prependOnceListener('error', errListener)
                .prependOnceListener('ready', readyListener)
                .setKeepAlive(this._keepAliveEnabled, this._keepAliveDelay)
                .connect(this.bridgePort, this.host);
        });
    }

    closeSocket(closeTimeoutMs: number = 2000): Promise<void> {
        return new Promise((resolve) => {
            let clearCloseListener = () => {};

            const closeTimeout = setTimeout(() => {
                clearCloseListener();
                this.socket.resetAndDestroy();
                return resolve();
            }, closeTimeoutMs);

            const closeListener = () => {
                clearTimeout(closeTimeout);
                return resolve();
            };

            clearCloseListener = () => {
                this.socket.removeListener('close', closeListener);
            };

            this.socket.removeListener('close', closeListener);
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
            this.socket.removeListener('error', errListener);
            this.socket.prependOnceListener('error', errListener);
            this.socket.removeListener('drain', drainListener);
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

    setAutoReconnect(
        enabled: boolean = true,
        maxTries: number = 10,
        delayMs: number = 1000,
    ): BridgeClient {
        if (enabled) {
            this._maxReconnect = maxTries > 0 ? maxTries : -1;
            this._reconnectDelayMs = delayMs;
        } else {
            this._maxReconnect = 0;
        }
        return this;
    }
}
