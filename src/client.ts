import fetch, { Response } from 'node-fetch';
import * as Errors from './errors';
import { MessageTypes, TrinciMessage, stdTrinciMessages } from './messageFormat';
import { arrayBufferToString } from './binConversions';
import { bytesToObject } from './utils';
import { SERVICE_ACCOUNT_ID as defServiceAccountID } from './systemDefaults';
import { BaseECKey } from './cryptography/baseECKey';
import { Account } from './account';
import { Transaction, ITxUnnamedObject } from './transaction';

export function sleep(ms: number) {
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

type TReqMethod = 'get' | 'GET' | 'post' | 'POST'

const submitMessaggePath = '/api/v1/message';

/**
 * Transaction event.
 */
 export interface ITxEvent {

    /** Identifier of the transaction which produced this event. */
    eventTx: string,

    /** Identifier of the Account which produced this event. */
    emitterAccount: string,

    /** Identifier of the smart contract which produced this event. */
    emitterSmartContract: string,

    /** Event name. */
    eventName: String,

    event_data: Uint8Array,
}

/**
 * Transaction receipt.
 */
export interface ITxReceiptData {

    /** Index(height) of the block containing the transaction. */
    blockIdx: number;

    /** Transaction index inside the block */
    txIdx: number;

    /** Amount of fuel burned during this transaction execution */
    burnedFuel: number

    /** Whether transaction was successfully executed by smart contract. */
    success: boolean;

    /** Smart contract execution result. */
    result: Uint8Array;

    // /** Event fired during smart contract execution. */
    events: ITxEvent[];
}

/**
 * List of assets. For internal use in IAccount interface
 */
interface IAssetList {
    [key: string]: Uint8Array;
}

/** Structure returned by Client.accountData() method. */
export interface IAccountData {
    /** Account ID. */
    accountId: string;

    /** List of assets on this account. */
    assets: IAssetList;

    /** Hash of the smart contract associated with this account. */
    contractHash: string | null;

    /** Hash of the data saved in this account. */
    dataHash: string | null;

    /** Data requested from this account. */
    requestedData: any[];
}

interface IGeneralBlockInfo {
    /** Block index(offset). Genesis block has height 0. */
    idx: number,
    /** Number of transactions within the block. */
    txCount: number,
    /** Hash of the previos block. */
    prevHash: string,
    /** Merkle tree root of the transactions within this block. */
    txsRoot: string,
    /** Merkle tree root of the receipts contained within this block. */
    receiptsRoot: string,
    /** Merkle tree root of all the accounts (aka world state). */
    accountsRoot: string,
}

/** Structure returned by Client.blockData() method */
export interface IBlockData {
    /** General data like merkle roots, number of txs etc. */
    info: IGeneralBlockInfo;

    /** list of transaction tickets within this block */
    tickets: string[];
}

/** List of registered smart contracts */
export interface IContractsList {
    [key: string]: {
        name: string;
        version: string;
        publisher: string;
        description: string;
        url: string;
    };
}

/** List of registered assets */
export interface IAssetsList {
    [key: string]: {
        name: string;
        creator: string;
        url: string;
        contractHash: string;
    };
}

/**
 * Internal function to send post and get requests using fetch() api.
 * @param method - method string
 * @param url - url string
 * @param body - data to send (only with post, null if 'get')
 * @param customHeaders - object with additional custom headers. Es: {header:'value'}
 * @returns - server's response
 */
function sendRequest(
    method: TReqMethod,
    url: string,
    body?: Uint8Array,
    customHeaders?: object,
): Promise<Response> {
    return new Promise((resolve, reject) => {
        let headers = { ...customHeaders };
        switch (method) {
            case 'get': case 'GET':
                break;
            case 'post': case 'POST': {
                let bodylength = 0;
                if (typeof body !== 'undefined') {
                    bodylength = Buffer.byteLength(body!);
                }
                const stdHeaders = {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': bodylength,
                };
                headers = { ...headers, ...stdHeaders };
                break;
            }
            default:
                throw new Error(Errors.REQUEST_UNSUPPORTED_METHOD);
        }
        fetch(
            url,
            {
                method,
                headers,
                body,
            },
        )
            .then((res: Response) => {
                return resolve(res);
            })
            .catch((err: any) => {
                return reject(err);
            });
    });
}

/**
 * Default http client to query a TRINCI node
 */
export class Client {
    private t2CoreBaseUrl: string;

    private t2CoreNetworkName: string;

    private _serviceAccount: string;

    /**
     * @param baseUrl - Base URL to connect to (e.g. 'https://my.server.net:8000/')
     * @param networkName - Name of the TRINCI network (a network will not accept transactions created for a differennt network)
     * @param customServiceAcc - Account ID hosting service smart contract. Set this only if your blockchain's default service account was changed
     */
    constructor(baseUrl: string = '', networkName: string = '', customServiceAcc: string = defServiceAccountID) {
        let lastIdx = 0;
        for (let i = baseUrl.length - 1; i >= 0; i -= 1) {
            if (baseUrl[i] !== '/') {
                lastIdx = i + 1;
                break;
            }
        }
        this.t2CoreBaseUrl = baseUrl.substring(0, lastIdx);
        this.t2CoreNetworkName = networkName;
        this._serviceAccount = customServiceAcc;
    }

    /** Base URL to connect to (e.g. 'https://my.server.net:8000/') */
    public set baseUrl(newUrl: string) {
        this.t2CoreBaseUrl = newUrl;
    }

    /** Base URL to connect to (e.g. 'https://my.server.net:8000/') */
    public get baseUrl(): string {
        return this.t2CoreBaseUrl;
    }

    /** Name of the TRINCI network */
    public set network(newNetName: string) {
        this.t2CoreBaseUrl = newNetName;
    }

    /** Name of the TRINCI network */
    public get network(): string {
        return this.t2CoreNetworkName;
    }

    /** Account ID hosting service smart contract. Set this only if your blockchain's default service account was changed */
    public get serviceAccount(): string {
        return this._serviceAccount;
    }

    /** Account ID hosting service smart contract. Set this only if your blockchain's default service account was changed */
    public set serviceAccount(customServiceAccount: string) {
        this._serviceAccount = customServiceAccount;
    }

    /**
     * Creates and sets a ready to be signed transaction.
     * Nonce is set automatically.
     * @param targetID - transaction destination accountID
     * @param contract - smart contract hash
     * @param method - method of the smart contract to call
     * @param args - arguments to pass  to the smart contract
     * @returns - Transaction class object ready to be signed
     */
    prepareUnsignedTx(
        targetID: string,
        contract: Uint8Array | string,
        method: string,
        args: any,
    ): Transaction {
        const tx = new Transaction();
        tx.accountId = targetID;
        tx.genNonce();
        tx.networkName = this.t2CoreNetworkName;
        tx.setSmartContractHash(contract);
        tx.smartContractMethod = method;
        tx.smartContractMethodArgs = args;
        return tx;
    }

    /**
     * Creates and sets a ready to be sent transaction.
     * Nonce is set automatically.
     * @param targetID - transaction destination accountID
     * @param contract - smart contract hash
     * @param method - method of the smart contract to call
     * @param args - arguments to pass  to the smart contract
     * @param signerKeyPair - keypair to sign the transaction
     * @returns - Transaction class object ready to be sent
     */
    prepareTx(
        targetID: string,
        contract: Uint8Array | string,
        method: string,
        args: any,
        signerPrivateKey: BaseECKey,
    ): Promise<Transaction> {
        return new Promise((resolve, reject) => {
            const tx = this.prepareUnsignedTx(targetID, contract, method, args);
            tx.sign(signerPrivateKey)
                .then(() => {
                    return resolve(tx);
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }

    /**
     * Sends a signed transaction to the blockchain
     * @param txToSubmit - Transaction to submit
     * @returns - Transaction ticket.
     */
    submitTx(txToSubmit: Transaction): Promise<string> {
        return new Promise((resolve, reject) => {
            if (
                (this.t2CoreNetworkName !== '')
                && (txToSubmit.networkName !== this.t2CoreNetworkName)
            ) {
                return reject(new Error(Errors.WRONG_TX_NETWORK));
            }
            txToSubmit.toUnnamedObject()
                .then((txObj: ITxUnnamedObject) => {
                    const msg = stdTrinciMessages.submitTransaction(true, txObj);
                    this.submitTrinciMessage(msg)
                        .then((resultMessage: TrinciMessage) => {
                            resultMessage.assertType(MessageTypes.SubmitTransactionResponse);
                            return resolve(Buffer.from(resultMessage.body.ticket).toString('hex'));
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Sends an array of transactions.
     * @param txToSubmit - Transaction to submit
     * @returns - array of transaction tickets (or errors) in the same order they were given.
     */
    submitTxArray(txList: Transaction[]): Promise<Array<string | Error>> {
        return new Promise((resolve, reject) => {
            const resultsArray: Array<string | Error> = new Array(txList.length);
            const promisesArray = new Array<Promise<string>>(txList.length);
            for (let txIdx = 0; txIdx < txList.length; txIdx += 1) {
                promisesArray[txIdx] = this.submitTx(txList[txIdx]);
            }
            // const settledPromises: PromiseSettledResult<string>[] = [];
            Promise.allSettled(promisesArray)
                .then((settledPromises: PromiseSettledResult<string>[]) => {
                    for (let prIdx = 0; prIdx < settledPromises.length; prIdx += 1) {
                        if (settledPromises[prIdx].status === 'fulfilled') {
                            resultsArray[prIdx] = (
                                settledPromises[prIdx] as PromiseFulfilledResult<string>
                            ).value;
                        } else {
                            resultsArray[prIdx] = new Error(
                                (
                                    settledPromises[prIdx] as PromiseRejectedResult
                                ).reason,
                            );
                        }
                    }
                    return resolve(resultsArray);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Concatenation of Client.prepareTx() and Client.submitTx() methods
     * @param targetID - transaction destination accountID
     * @param contract - smart contract hash
     * @param method - method of the smart contract to call
     * @param args - arguments to pass  to the smart contract
     * @param signerKeyPair - keypair to sign the transaction
     * @returns - Transaction ticket.
     */
    prepareAndSubmitTx(
        targetID: string,
        contract: Uint8Array | string,
        method: string,
        args: any,
        signerPrivateKey: BaseECKey,
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            this.prepareTx(targetID, contract, method, args, signerPrivateKey)
                .then((preparedTx) => {
                    this.submitTx(preparedTx)
                        .then((ticket) => {
                            return resolve(ticket);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Concatenation of tx.sign() and Client.submitTx() methods
     * @param tx - transaction to sign and submit
     * @param signerKeyPair - keypair to sign the transaction
     * @returns - Transaction ticket.
     */
    signAndSubmitTx(
        tx: Transaction,
        signerPrivateKey: BaseECKey,
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            tx.sign(signerPrivateKey)
                .then(() => {
                    this.submitTx(tx)
                        .then((ticket) => {
                            return resolve(ticket);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Returns transaction by a ticket.
     * @param ticket - transaction ticket as returned by Client.submitTx()
     * or similar methods.
     * @returns - Transaction.
     */
    txData(ticket: string): Promise<Transaction> {
        return new Promise((resolve, reject) => {
            const msg = stdTrinciMessages.getTransaction(ticket);
            this.submitTrinciMessage(msg)
                .then((resultMessage: TrinciMessage) => {
                    resultMessage.assertType(MessageTypes.GetTransactionResponse);
                    const resultTx = new Transaction();
                    resultTx.fromUnnamedObject(resultMessage.body.tx)
                        .then(() => {
                            return resolve(resultTx);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(new Error(error));
                });
        });
    }

    /**
     * Returns transaction execution receipt.
     * @param ticket - transaction ticket as returned by Client.submitTx()
     * or Client.prepareAndSubmit() methods, or just a string.
     * @returns - Transaction execution receipt.
     */
    txReceipt(ticket: string): Promise<ITxReceiptData> {
        return new Promise((resolve, reject) => {
            const msg = stdTrinciMessages.getReceipt(ticket);
            this.submitTrinciMessage(msg)
                .then((resultMessage: TrinciMessage) => {
                    resultMessage.assertType(MessageTypes.GetReceiptResponse);
                    const txReceiptObject: ITxReceiptData = {
                        blockIdx: resultMessage.body.receipt[0],
                        txIdx: resultMessage.body.receipt[1],
                        burnedFuel: resultMessage.body.receipt[2],
                        success: resultMessage.body.receipt[3],
                        result: new Uint8Array(resultMessage.body.receipt[4]),
                        events: [],
                    };
                    if (resultMessage.body.receipt.length === 6) {
                        for (let i = 0; i < resultMessage.body.receipt[5].length; i++) {
                            txReceiptObject.events.push({
                                eventTx: resultMessage.body.receipt[5][i][0].toString('hex'),
                                emitterAccount: resultMessage.body.receipt[5][i][1],
                                emitterSmartContract: resultMessage.body.receipt[5][i][2].toString('hex'),
                                eventName: resultMessage.body.receipt[5][i][3],
                                event_data: new Uint8Array(resultMessage.body.receipt[5][i][4]),
                            })
                            
                        }
                    }
                    return resolve(txReceiptObject);
                })
                .catch((error: any) => {
                    return reject(new Error(error));
                });
        });
    }

    /**
     * Method that returns info about a block in blockchain.
     * @param height - Block's index.
     * @returns - Block info.
     */
    blockData(height: number, showTxs: boolean = true): Promise<IBlockData> {
        return new Promise((resolve, reject) => {
            const msg = stdTrinciMessages.getBlock(height, showTxs);
            this.submitTrinciMessage(msg)
                .then((resultMessage: TrinciMessage) => {
                    resultMessage.assertType(MessageTypes.GetBlockResponse);
                    const blockDataObj: IBlockData = {
                        info: {
                            idx: resultMessage.body.blockInfo[0],
                            txCount: resultMessage.body.blockInfo[1],
                            prevHash: Buffer.from(resultMessage.body.blockInfo[2]).toString('hex'),
                            txsRoot: Buffer.from(resultMessage.body.blockInfo[3]).toString('hex'),
                            receiptsRoot: Buffer.from(resultMessage.body.blockInfo[4]).toString('hex'),
                            accountsRoot: Buffer.from(resultMessage.body.blockInfo[5]).toString('hex'),
                        },
                        tickets: [],
                    };
                    if (showTxs) {
                        for (let i = 0; i < resultMessage.body.ticketList.length; i += 1) {
                            blockDataObj.tickets.push(Buffer.from(resultMessage.body.ticketList[i]).toString('hex'));
                        }
                    }
                    return resolve(blockDataObj);
                })
                .catch((error: any) => {
                    return reject(new Error(error));
                });
        });
    }

    /**
     * This method returns info of an account, if found.
     * @param account - Account as an account ID or Account class object.
     * @param keysArray - view account data under certain keys
     * @returns - Account info.
     */
    accountData(account: string | Account, keysArray: string[] = []): Promise<IAccountData> {
        return new Promise((resolve, reject) => {
            let id: string;
            if (typeof account === 'string') {
                id = account;
            } else {
                id = account.accountId;
            }
            const msg = stdTrinciMessages.getAccount(id, keysArray);
            this.submitTrinciMessage(msg)
                .then((resultMessage: TrinciMessage) => {
                    resultMessage.assertType(MessageTypes.GetAccountResponse);
                    const accDataObj: IAccountData = {
                        accountId: resultMessage.body.accountInfo[0],
                        assets: {},
                        contractHash: null,
                        dataHash: null,
                        requestedData: resultMessage.body.data,
                    };
                    if (resultMessage.body.accountInfo[2]) {
                        accDataObj.contractHash = Buffer.from(
                            resultMessage.body.accountInfo[2],
                        ).toString('hex');
                    }
                    if (resultMessage.body.accountInfo[3]) {
                        accDataObj.dataHash = Buffer.from(
                            resultMessage.body.accountInfo[3],
                        ).toString('hex');
                    }
                    const assets = Object.keys(resultMessage.body.accountInfo[1]);
                    assets.forEach((assetName: string) => {
                        accDataObj.assets[assetName] = new Uint8Array(
                            resultMessage.body.accountInfo[1][assetName],
                        );
                    });
                    return resolve(accDataObj);
                })
                .catch((error: any) => {
                    return reject(new Error(error));
                });
        });
    }

    /**
     * This method waits for a transaction to be confirmed by sending periodical requests
     * to get the status of the transaction.
     * @param ticket - transaction ticket as returned by Client.submitTx()
     * or Client.prepareAndSubmit() methods, or just a string.
     * @param maxTries - Max number of requests, after which method throws
     * @param sleepMs - Pause in milliseconds between requests
     * @returns - Transaction receipt
     */
    async waitForTicket(
        ticket: string,
        maxTries: number = 8,
        sleepMs: number = 1000,
    ): Promise<ITxReceiptData> {
        let counter = 0;
        while (counter < maxTries) {
            let receipt: any = null;
            try {
                receipt = await this.txReceipt(ticket);
            } catch (error: any) {
                const errMsg: string = error.message;
                if (errMsg.indexOf('resource not found') === -1) {
                    throw new Error(error);
                }
            }
            if (receipt !== null) {
                return receipt;
            }
            counter += 1;
            await sleep(sleepMs);
        }
        throw new Error(`Tx ${ticket} not executed in time`);
    }

    /**
     * This method waits for an array of transactions to be executed by core
     * by sending periodical requests to get the status of transactions.
     * @param ticket - transaction ticket as returned by Client.submitTx()
     * or Client.prepareAndSubmit() methods, or just a string.
     * @param maxTries - Max number of requests, after which method throws
     * @param sleepMs - Pause in milliseconds between requests
     * @returns - Transaction receipt
     */
    async waitForTicketArray(
        ticketList: Array<string | Error>,
        maxTries: number = 8,
        sleepMs: number = 1000,
    ): Promise<Array<string | ITxReceiptData>> {
        const results = Array<string | ITxReceiptData>(ticketList.length);
        results.fill('');
        for (let i = 0; i < maxTries; i += 1) {
            let nextIteration = false;
            for (let ticketIdx = 0; ticketIdx < ticketList.length; ticketIdx += 1) {
                if (
                    typeof ticketList[ticketIdx] === 'string'
                    && results[ticketIdx] === ''
                ) {
                    try {
                        results[ticketIdx] = await this.txReceipt(ticketList[ticketIdx] as string);
                    } catch (error: any) {
                        const errMsg: string = error.message;
                        if (errMsg.indexOf('resource not found') === -1) {
                            results[ticketIdx] = error.message;
                        }
                    }
                    if (results[ticketIdx] === '') {
                        nextIteration = true;
                    }
                }
            }
            if (!nextIteration) {
                return results;
            }
            await sleep(sleepMs);
        }
        throw new Error('Transactions not executed in time');
    }

    /**
     * This method returns a list of all published contracts.
     */
    registeredContractsList(): Promise<IContractsList> {
        return new Promise((resolve, reject) => {
            const msg = stdTrinciMessages.getAccount(`${this._serviceAccount}`, ['contracts']);
            this.submitTrinciMessage(msg)
                .then((resultMessage: TrinciMessage) => {
                    resultMessage.assertType(MessageTypes.GetAccountResponse);
                    const contractsList = bytesToObject(
                        new Uint8Array(resultMessage.body.data[0]),
                    );
                    const hashes = Object.keys(contractsList);
                    const resultList: IContractsList = {};
                    hashes.forEach((hash: string) => {
                        resultList[hash] = {
                            name: contractsList[hash][0],
                            version: contractsList[hash][1],
                            publisher: contractsList[hash][2],
                            description: contractsList[hash][3],
                            url: contractsList[hash][4],
                        };
                    });
                    return resolve(resultList);
                })
                .catch((error: any) => {
                    return reject(new Error(error));
                });
        });
    }

    /**
     * This method returns a list of all assets registered within service account.
     */
    registeredAssetsList(): Promise<IAssetsList> {
        return new Promise((resolve, reject) => {
            const msg = stdTrinciMessages.getAccount(`${this._serviceAccount}`, ['assets']);
            this.submitTrinciMessage(msg)
                .then((resultMessage: TrinciMessage) => {
                    resultMessage.assertType(MessageTypes.GetAccountResponse);
                    const resultList: IAssetsList = {};
                    let assetsList: any = {};
                    if (resultMessage.body.data[0]) {
                        assetsList = bytesToObject(
                            new Uint8Array(resultMessage.body.data[0]),
                        );
                    }
                    const accounts = Object.keys(assetsList);
                    accounts.forEach((accountId: string) => {
                        resultList[accountId] = {
                            name: assetsList[accountId][0],
                            creator: assetsList[accountId][1],
                            url: assetsList[accountId][2],
                            contractHash: Buffer.from(assetsList[accountId][3]).toString('hex'),
                        };
                    });
                    return resolve(resultList);
                })
                .catch((error: any) => {
                    return reject(new Error(error));
                });
        });
    }

    /**
     * Sends a message to the blockchain in "Trinci Message" format
     */
    submitTrinciMessage(message: TrinciMessage): Promise<TrinciMessage> {
        return new Promise((resolve, reject) => {
            const msgBytes = message.toBytes();
            const url = `${this.t2CoreBaseUrl}${submitMessaggePath}`;
            sendRequest('post', url, msgBytes)
                .then((result: Response) => {
                    result.arrayBuffer()
                        .then((resBuffer: ArrayBuffer) => {
                            if (result.status !== 200) {
                                return reject(new Error(`${result.status}: ${arrayBufferToString(resBuffer)}`));
                            }
                            const responseMessage = new TrinciMessage();
                            responseMessage.fromBytes(new Uint8Array(resBuffer));
                            return resolve(responseMessage);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
