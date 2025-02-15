import fetch, { RequestInit, Response } from 'node-fetch';
import {
    BaseECKey,
    Utils as CoreUtils,
    UnitaryTransaction,
    BaseTransaction,
    Transaction,
    IBaseTxUnnamedObject,
    Message,
    CryptoDefaults,
    Account,
    hexEncode,
} from '@affidaty/t2-lib-core';
import * as Errors from './errors';
import {
    SERVICE_ACCOUNT_ID as defServiceAccountID,
    SUBMIT_MESSAGE_PATH as submitMessaggePath,
    NODE_VISA_PATH as nodeVisaPath,
    BOOTSTRAP_DL_PATH as nodeBootstrapDlPath,
    REQ_DEF_ABORT_TIMEOUT_MS as defaultTimeoutMs,
} from './systemDefaults';

type TReqMethod = 'get' | 'GET' | 'post' | 'POST';

type ReqOpts = Omit<RequestInit, 'body' | 'headers' | 'method'> & { timeout?: number };
interface IBlockchainSettings {
    acceptBroadcast: boolean;
    blockThreshold: number;
    blockTimeout: number;
    burningFuelMethod: string;
}

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
    eventName: string,

    eventData: Uint8Array,
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
    burnedFuel: number;

    /** Whether transaction was successfully executed by smart contract. */
    success: boolean;

    /** Smart contract execution result. */
    result: Uint8Array;

    // /** Event fired during smart contract execution. */
    events: ITxEvent[];
}

export interface IBulkSingleResult {
    success: boolean;
    burnedFuel: number;
    result: Uint8Array;
}

export interface IBulkTxReceiptData {

    /** Index(height) of the block containing the transaction. */
    blockIdx: number;

    /** Transaction index inside the block */
    txIdx: number;

    /** Amount of fuel burned during this transaction execution */
    burnedFuel: number;

    /** Whether transaction was successfully executed by smart contract. */
    success: boolean;

    /** Smart contract execution result. */
    results: Uint8Array | {
        [key: string]: IBulkSingleResult;
    };

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
    requestedData: Uint8Array[];
}

interface IGeneralBlockInfo {
    /** Public key of the entity that produced this block signature. */
    signer: BaseECKey
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
    /** Block creation timestamp */
    timestamp: number,
}

/** Structure returned by Client.blockData() method */
export interface IBlockData {
    /** General data like merkle roots, number of txs etc. */
    info: IGeneralBlockInfo;

    /** Block signature. */
    signature: Uint8Array;

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

function sleep(ms: number) {
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

/**
 * Internal function to send post and get requests using fetch() api.
 * @param method - method string
 * @param url - url string
 * @param body - data to send (only with post, null if 'get')
 * @param customHeaders - object with additional custom headers. Es: \{"header_name":"value"\}
 * @returns - server's response
 */
function sendRequest(
    method: TReqMethod,
    url: string,
    body?: Uint8Array,
    customHeaders?: {[key: string]: string},
    options?: ReqOpts,
): Promise<Response> {
    return new Promise((resolve, reject) => {
        let tempHeaders: {[key: string]: any} = {};
        switch (method) {
            case 'get': case 'GET':
                break;
            case 'post': case 'POST': {
                let bodylength = 0;
                if (typeof body !== 'undefined') {
                    bodylength = body.byteLength;
                }
                tempHeaders = {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': bodylength,
                };
                break;
            }
            default:
                throw new Error(Errors.REQUEST_UNSUPPORTED_METHOD);
        }

        const headers: {[key: string]: any} = {};
        const tempHEntries = Object.entries(tempHeaders);
        for (let i = 0; i < tempHEntries.length; i += 1) {
            headers[tempHEntries[i][0].toLowerCase()] = tempHEntries[i][1];
        }

        // user-provided standard headers (if any) are used instead of generated
        if (customHeaders) {
            const customHEntries = Object.entries(customHeaders);
            for (let i = 0; i < customHEntries.length; i += 1) {
                headers[customHEntries[i][0].toLowerCase()] = customHEntries[i][1];
            }
        }

        // creating internal options object
        const _opts = { ...options };

        // if no abort signal was defined in options, then create a new one
        let abortController: AbortController | undefined;
        let timeoutHandler: NodeJS.Timeout | undefined;
        // if no abort signal was set, then create a new one in place
        if (!_opts.signal && _opts.timeout !== 0) {
            // if neither a timeout was set, then use the default one
            if (!_opts.timeout) _opts.timeout = defaultTimeoutMs;
            abortController = new AbortController();
            _opts.signal = abortController.signal;
            timeoutHandler = setTimeout(() => {
                abortController!.abort();
            }, _opts.timeout);
        }
        if (_opts.signal) {
            _opts.signal.onabort = () => {
                return reject(new Error(Errors.REQ_ABORT_ERR));
            };
        }

        // launch fetch request
        fetch(
            url,
            {
                method,
                headers,
                body: body ? Buffer.from(body) : undefined,
                ..._opts,
            },
        )
            .then((res: Response) => {
                if (timeoutHandler) {
                    clearTimeout(timeoutHandler);
                }
                return resolve(res);
            })
            .catch((err: any) => {
                if (timeoutHandler) {
                    clearTimeout(timeoutHandler);
                }
                return reject(err);
            });
    });
}

/**
 * Default http client to query a TRINCI node
 */
export class Client {
    static sendRequest = sendRequest;

    private t2CoreBaseUrl: string;

    private t2CoreNetworkName: string;

    private _serviceAccount: string;

    private _timeout: number = defaultTimeoutMs;

    private _abortController: AbortController | undefined;

    /**
     * @param baseUrl - Base URL to connect to (e.g. 'https://my.server.net:8000/')
     * @param networkName - Name of the TRINCI network (a network will not accept transactions
     * created for a differennt network)
     * @param customServiceAcc - Account ID hosting service smart contract. Set this only if
     * your blockchain's default service account was changed
     */
    constructor(baseUrl: string = '', networkName: string = '', customServiceAcc: string = defServiceAccountID) {
        const urlObj = new URL(baseUrl);
        if (urlObj.hostname.length < 1) {
            this.t2CoreBaseUrl = `http://${urlObj.protocol}${urlObj.pathname.substring(0, urlObj.pathname.indexOf('/') >= 0 ? urlObj.pathname.indexOf('/') : urlObj.pathname.length)}`;
        } else {
            this.t2CoreBaseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}`;
        }
        this.t2CoreNetworkName = networkName;
        this._serviceAccount = customServiceAcc;
    }

    /**
     * Timeout as number of milliseconds
     */
    public set timeout(timeout: number) {
        this._timeout = timeout;
    }

    /**
     * Timeout as number of milliseconds
     */
    public get timeout(): number {
        return this._timeout;
    }

    /**
     * Timeout as number of milliseconds
     */
    public setTimeout(timeout: number): Client {
        this.timeout = timeout;
        return this;
    }

    /**
     * Custom AbortController for aborting pending requests.
     * If set, timeout will be completely ignored.
     */
    public set abortController(customAC: AbortController | undefined) {
        this._abortController = customAC;
    }

    /**
     * Custom AbortController for aborting pending requests.
     * If set, timeout will be completely ignored.
     */
    public get abortController(): AbortController | undefined {
        return this._abortController;
    }

    /**
     * Custom AbortController for aborting pending requests.
     * If set, timeout will be completely ignored.
     */
    public setAbortController(customAC: AbortController | undefined): Client {
        this.abortController = customAC;
        return this;
    }

    protected getReqOpts(): ReqOpts {
        const opts: ReqOpts = {};
        if (this._abortController) {
            opts.signal = this._abortController.signal;
        } else if (typeof this._timeout === 'number') {
            opts.timeout = this._timeout;
        }
        return opts;
    }

    /** Base URL to connect to (e.g. 'https://my.server.net:8000/') */
    public set baseUrl(newUrl: string) {
        this.t2CoreBaseUrl = newUrl;
    }

    /** Base URL to connect to (e.g. 'https://my.server.net:8000/') */
    public get baseUrl(): string {
        return this.t2CoreBaseUrl;
    }

    /** Base URL to connect to (e.g. 'https://my.server.net:8000/') */
    public setBaseUrl(newUrl: string): Client {
        this.baseUrl = newUrl;
        return this;
    }

    /** Name of the TRINCI network */
    public set network(newNetName: string) {
        this.t2CoreNetworkName = newNetName;
    }

    /** Name of the TRINCI network */
    public get network(): string {
        return this.t2CoreNetworkName;
    }

    /** Name of the TRINCI network */
    public setNetwork(newNetName: string): Client {
        this.network = newNetName;
        return this;
    }

    /** Account ID hosting service smart contract. Set this only if your blockchain's default
     * service account was changed */
    public get serviceAccount(): string {
        return this._serviceAccount;
    }

    /** Account ID hosting service smart contract. Set this only if your blockchain's default
     * service account was changed */
    public set serviceAccount(customServiceAccount: string) {
        this._serviceAccount = customServiceAccount;
    }

    /** Account ID hosting service smart contract. Set this only if your blockchain's default
     * service account was changed */
    public setServiceAccount(customServiceAccount: string): Client {
        this.serviceAccount = customServiceAccount;
        return this;
    }

    getBlockchainSettings(): Promise<IBlockchainSettings> {
        return new Promise((resolve, reject) => {
            this.accountData(this.serviceAccount, ['blockchain:settings'])
                .then((serviceAccountData: IAccountData) => {
                    const tempObj = CoreUtils.bytesToObject(serviceAccountData.requestedData[0]);
                    const result: IBlockchainSettings = {
                        acceptBroadcast: tempObj.accept_broadcast,
                        blockThreshold: tempObj.block_threshold,
                        blockTimeout: tempObj.block_timeout,
                        burningFuelMethod: tempObj.burning_fuel_method,
                    };
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Creates and sets a ready to be signed transaction.
     * Nonce is set automatically.
     * @param targetID - transaction destination accountID
     * @param maxFuel - max amount of fuel you are willing to spend on this transaction
     * @param contract - smart contract hash
     * @param method - method of the smart contract to call
     * @param args - arguments to pass  to the smart contract
     * @returns - Transaction class object ready to be signed
     */
    prepareUnsignedTx(
        targetID: string,
        maxFuel: number,
        contract: Uint8Array | string,
        method: string,
        args: any,
    ): UnitaryTransaction {
        const tx = new UnitaryTransaction();
        tx.data.accountId = targetID;
        tx.data.genNonce();
        tx.data.maxFuel = maxFuel;
        tx.data.networkName = this.t2CoreNetworkName;
        tx.data.setSmartContractHash(contract);
        tx.data.smartContractMethod = method;
        tx.data.smartContractMethodArgs = args;
        return tx;
    }

    /**
     * Creates and sets a ready to be sent transaction.
     * Nonce is set automatically.
     * @param targetID - transaction destination accountID
     * @param maxFuel - max amount of fuel you are willing to spend on this transaction
     * @param contract - smart contract hash
     * @param method - method of the smart contract to call
     * @param args - arguments to pass  to the smart contract
     * @param signerPrivateKey - keypair to sign the transaction
     * @returns - Transaction class object ready to be sent
     */
    prepareTx(
        targetID: string,
        maxFuel: number,
        contract: Uint8Array | string,
        method: string,
        args: any,
        signerPrivateKey: BaseECKey,
    ): Promise<UnitaryTransaction> {
        return new Promise((resolve, reject) => {
            const tx = this.prepareUnsignedTx(targetID, maxFuel, contract, method, args);
            tx.sign(signerPrivateKey)
                .then(() => {
                    return resolve(tx);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Sends a signed transaction to the blockchain
     * @param txToSubmit - Transaction to submit
     * @returns - Transaction ticket.
     */
    submitTx(txToSubmit: BaseTransaction): Promise<string> {
        return new Promise((resolve, reject) => {
            // if (
            //     (this.t2CoreNetworkName !== '')
            //     && (txToSubmit.data.networkName !== this.t2CoreNetworkName)
            // ) {
            //     return reject(new Error(Errors.WRONG_TX_NETWORK));
            // }
            txToSubmit.toUnnamedObject()
                .then((txObj: IBaseTxUnnamedObject) => {
                    const msg = Message.stdTrinciMessages.submitTransaction(true, txObj);
                    this.submitTrinciMessage(msg)
                        .then((resultMessage: Message.TrinciMessage) => {
                            resultMessage.assertType(Message.MessageTypes.PutTransactionResponse);
                            return resolve(hexEncode(resultMessage.body.ticket));
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
     * @param txList - Transactions array to submit
     * @returns - array of transaction tickets (or errors) in the same order they were given.
     */
    submitTxArray(txList: BaseTransaction[]): Promise<Array<string | Error>> {
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
     * @param maxFuel - max amount of fuel you are willing to spend on this transaction
     * @param contract - smart contract hash
     * @param method - method of the smart contract to call
     * @param args - arguments to pass  to the smart contract
     * @param signerPrivateKey - keypair to sign the transaction
     * @returns - Transaction ticket.
     */
    prepareAndSubmitTx(
        targetID: string,
        maxFuel: number,
        contract: Uint8Array | string,
        method: string,
        args: any,
        signerPrivateKey: BaseECKey,
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            this.prepareTx(targetID, maxFuel, contract, method, args, signerPrivateKey)
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
     * @param signerPrivateKey - keypair to sign the transaction
     * @returns - Transaction ticket.
     */
    signAndSubmitTx(
        tx: BaseTransaction,
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
    txData(ticket: string): Promise<BaseTransaction> {
        return new Promise((resolve, reject) => {
            const msg = Message.stdTrinciMessages.getTransaction(ticket);
            this.submitTrinciMessage(msg)
                .then((resultMessage: Message.TrinciMessage) => {
                    resultMessage.assertType(Message.MessageTypes.GetTransactionResponse);
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
            const msg = Message.stdTrinciMessages.getReceipt(ticket);
            this.submitTrinciMessage(msg)
                .then((resultMessage: Message.TrinciMessage) => {
                    resultMessage.assertType(Message.MessageTypes.GetReceiptResponse);
                    const txReceiptObject: ITxReceiptData = {
                        blockIdx: resultMessage.body.receipt[0],
                        txIdx: resultMessage.body.receipt[1],
                        burnedFuel: resultMessage.body.receipt[2],
                        success: resultMessage.body.receipt[3],
                        result: new Uint8Array(resultMessage.body.receipt[4]),
                        events: [],
                    };
                    if (resultMessage.body.receipt.length === 6) {
                        for (let i = 0; i < resultMessage.body.receipt[5].length; i += 1) {
                            txReceiptObject.events.push({
                                eventTx: hexEncode(resultMessage.body.receipt[5][i][0]),
                                emitterAccount: resultMessage.body.receipt[5][i][1],
                                emitterSmartContract: hexEncode(
                                    resultMessage.body.receipt[5][i][2],
                                ),
                                eventName: resultMessage.body.receipt[5][i][3],
                                eventData: new Uint8Array(resultMessage.body.receipt[5][i][4]),
                            });
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
     * @param height - Block's index. Can be a hex string to input numbers beyond JS capabilities.
     * @returns - Block info.
     */
    blockData(height: number | string, showTxs: boolean = true): Promise<IBlockData> {
        return new Promise((resolve, reject) => {
            let getBlockMsgArg = height;
            if (getBlockMsgArg === 'max' || getBlockMsgArg === 'MAX') {
                getBlockMsgArg = 'ffffffffffffffff';
            }
            const msg = Message.stdTrinciMessages.getBlock(getBlockMsgArg, showTxs);
            this.submitTrinciMessage(msg)
                .then((resultMessage: Message.TrinciMessage) => {
                    resultMessage.assertType(Message.MessageTypes.GetBlockResponse);
                    let signerKeyParamsId: string = CryptoDefaults.EKeyParamsIds.EMPTY;

                    // In case of the genesis block this field will be "null" and
                    // no key should be imported
                    if (resultMessage.body.blockInfo[0][0]) {
                        signerKeyParamsId = resultMessage.body.blockInfo[0][0][0];
                        if (resultMessage.body.blockInfo[0][0][1].length > 0) {
                            signerKeyParamsId += `_${resultMessage.body.blockInfo[0][0][1]}`;
                        }
                        if (!CryptoDefaults.mKeyPairParams.has(signerKeyParamsId)) {
                            return reject(new Error(Errors.IMPORT_TYPE_ERROR));
                        }
                    }
                    const blockDataObj: IBlockData = {
                        info: {
                            signer: new BaseECKey(
                                CryptoDefaults.mKeyPairParams.get(signerKeyParamsId)!.publicKey,
                            ),
                            idx: resultMessage.body.blockInfo[0][1],
                            txCount: resultMessage.body.blockInfo[0][2],
                            prevHash: hexEncode(resultMessage.body.blockInfo[0][3]),
                            txsRoot: hexEncode(resultMessage.body.blockInfo[0][4]),
                            receiptsRoot: hexEncode(resultMessage.body.blockInfo[0][5]),
                            accountsRoot: hexEncode(resultMessage.body.blockInfo[0][6]),
                            timestamp: typeof resultMessage.body.blockInfo[0][7] === 'number' ? resultMessage.body.blockInfo[0][7] : 0,
                        },
                        signature: new Uint8Array(resultMessage.body.blockInfo[1]),
                        tickets: [],
                    };
                    if (showTxs) {
                        for (let i = 0; i < resultMessage.body.ticketList.length; i += 1) {
                            blockDataObj.tickets.push(hexEncode(resultMessage.body.ticketList[i]));
                        }
                    }
                    if (signerKeyParamsId === CryptoDefaults.EKeyParamsIds.EMPTY) {
                        return resolve(blockDataObj);
                    }
                    blockDataObj.info.signer.setRaw(resultMessage.body.blockInfo[0][0][2])
                        .then((result) => {
                            if (!result) {
                                return reject(new Error('Key import returned false.'));
                            }
                            return resolve(blockDataObj);
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
            const msg = Message.stdTrinciMessages.getAccount(id, keysArray);
            this.submitTrinciMessage(msg)
                .then((resultMessage: Message.TrinciMessage) => {
                    resultMessage.assertType(Message.MessageTypes.GetAccountResponse);
                    const accDataObj: IAccountData = {
                        accountId: resultMessage.body.accountInfo[0],
                        assets: {},
                        contractHash: null,
                        dataHash: null,
                        requestedData: [],
                    };
                    if (resultMessage.body.data && resultMessage.body.data.length) {
                        for (let i = 0; i < resultMessage.body.data.length; i += 1) {
                            accDataObj.requestedData.push(
                                new Uint8Array(resultMessage.body.data[i]),
                            );
                        }
                    }
                    if (resultMessage.body.accountInfo[2]) {
                        accDataObj.contractHash = hexEncode(
                            resultMessage.body.accountInfo[2],
                        );
                    }
                    if (resultMessage.body.accountInfo[3]) {
                        accDataObj.dataHash = hexEncode(
                            resultMessage.body.accountInfo[3],
                        );
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
     * @param maxTries - Max number of requests, after which method throws.
     * 0 for unlimited. defaults to 8
     * @param sleepMs - Pause in milliseconds between requests
     * @returns - Transaction receipt
     */
    async waitForTicket(
        ticket: string,
        maxTries: number = 10,
        sleepMs: number = 1000,
    ): Promise<ITxReceiptData> {
        let counter = 0;
        while (maxTries === 0 || counter < maxTries) {
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
            if (maxTries > 0) {
                counter += 1;
            }
            await sleep(sleepMs);
        }
        throw new Error(`Tx ${ticket} not executed in time`);
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
    async waitForBulkTicket(
        ticket: string,
        maxTries: number = 8,
        sleepMs: number = 1000,
    ): Promise<IBulkTxReceiptData> {
        let counter = 0;
        while (counter < maxTries) {
            let receipt: any = null;
            try {
                receipt = await this.bulkTxReceipt(ticket);
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

    bulkTxReceipt(ticket: string): Promise<IBulkTxReceiptData> {
        return new Promise((resolve, reject) => {
            this.txReceipt(ticket)
                .then((txReceipt: ITxReceiptData) => {
                    const finalReceipt: IBulkTxReceiptData = {
                        blockIdx: txReceipt.blockIdx,
                        txIdx: txReceipt.txIdx,
                        burnedFuel: txReceipt.burnedFuel,
                        success: txReceipt.success,
                        results: txReceipt.result,
                        events: txReceipt.events,
                    };
                    let resultsUnpacked: any;
                    try {
                        resultsUnpacked = CoreUtils.bytesToObject(txReceipt.result);
                    } catch (e) {
                        resultsUnpacked = undefined;
                    }
                    if (typeof resultsUnpacked !== 'undefined'
                        && Array.isArray(resultsUnpacked)
                    ) {
                        finalReceipt.results = {};
                        for (let i = 0; i < resultsUnpacked.length; i += 1) {
                            finalReceipt.results[resultsUnpacked[i][0]] = {
                                success: resultsUnpacked[i][1][0] as boolean,
                                burnedFuel: resultsUnpacked[i][1][2],
                                result: new Uint8Array(resultsUnpacked[i][1][1]),
                            };
                        }
                    }
                    return resolve(finalReceipt);
                })
                .catch((error: any) => {
                    return reject(new Error(error));
                });
        });
    }

    /**
     * This method waits for an array of transactions to be executed by core
     * by sending periodical requests to get the status of transactions.
     * @param ticketList - transaction ticket as returned by Client.submitTx()
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
            this.accountData(this._serviceAccount, ['*'])
                .then((accDataKeysList: IAccountData) => {
                    let keysList: string[] = CoreUtils.bytesToObject(
                        new Uint8Array(accDataKeysList.requestedData[0]),
                    );
                    keysList = keysList.filter((value: string) => {
                        if (
                            value.length > 19
                            && value.substring(0, 19) === 'contracts:metadata:'
                        ) {
                            return true;
                        }
                        return false;
                    });
                    this.accountData(this._serviceAccount, keysList)
                        .then((accDataAllKeys: IAccountData) => {
                            const result: IContractsList = {};
                            accDataAllKeys.requestedData.forEach((value: Uint8Array, i: number) => {
                                const tempObj = CoreUtils.bytesToObject(value);
                                result[keysList[i].substring(19)] = tempObj;
                            });
                            return resolve(result);
                        })
                        .catch((error: any) => {
                            return reject(new Error(error));
                        });
                })
                .catch((error: any) => {
                    return reject(new Error(error));
                });
        });
    }

    /**
     * Sends a message to the blockchain in "Trinci Message" format
     */
    submitTrinciMessage(message: Message.TrinciMessage): Promise<Message.TrinciMessage> {
        return new Promise((resolve, reject) => {
            const msgBytes = message.toBytes();
            const url = `${this.t2CoreBaseUrl}${submitMessaggePath}`;
            sendRequest('post', url, msgBytes, undefined, this.getReqOpts())
                .then((result: Response) => {
                    result.arrayBuffer()
                        .then((resBuffer: ArrayBuffer) => {
                            if (result.status !== 200) {
                                return reject(new Error(`${result.status}: ${new TextDecoder().decode(resBuffer)}`));
                            }
                            const responseMessage = new Message.TrinciMessage();
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

    getNodeInfo(): Promise<string> {
        return new Promise((resolve, reject) => {
            const url = `${this.t2CoreBaseUrl}${nodeVisaPath}`;
            sendRequest('get', url, undefined, undefined, this.getReqOpts())
                .then((result: Response) => {
                    result.arrayBuffer()
                        .then((resBuffer: ArrayBuffer) => {
                            if (result.status !== 200) {
                                return reject(new Error(`${result.status}: ${new TextDecoder().decode(resBuffer)}`));
                            }
                            return resolve(new TextDecoder().decode(resBuffer));
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

    getNodeBootstrap(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            const url = `${this.t2CoreBaseUrl}${nodeBootstrapDlPath}`;
            sendRequest('get', url, undefined, undefined, this.getReqOpts())
                .then((result: Response) => {
                    result.arrayBuffer()
                        .then((resBuffer: ArrayBuffer) => {
                            if (result.status !== 200) {
                                return reject(new Error(`${result.status}: ${new TextDecoder().decode(resBuffer)}`));
                            }
                            return resolve(new Uint8Array(resBuffer));
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
