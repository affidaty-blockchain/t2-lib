import * as Errors from '../errors';
import { WebCrypto } from '../cryptography/webCrypto';
import { objectToBytes, bytesToObject, sha256 } from '../utils';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/base';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
    EmptyKeyParams,
    EKeyParamsIds,
    mKeyPairParams,
} from '../cryptography/cryptoDefaults';
import { BaseECKey } from '../cryptography/baseECKey';
import {
    CommonParentTxData,
    ICommonParentTxDataInternal,
    ICommonParentTxDataUnnamedObject,
    ICommonParentTxDataObjectWithBuffers,
    ICommonParentTxDataObject,
} from './commonParentTxData';
import { TxTypes, TTxSchemaType } from './txTypes';
import {
    BaseTxData
} from './baseTxData';
import {
    Signable,
    ISignableObject,
    ISignableObjectWithBuffer,
    ISignableUnnamedObject,
} from '../signable';

const SCHEMA_MAP = new Map<TTxSchemaType, ()=>CommonParentTxData>();
SCHEMA_MAP.set(BaseTxData.defaultSchema, ()=>{return new BaseTxData()});

interface IBaseTxUnnamedObject extends ISignableUnnamedObject {
    [0]: ICommonParentTxDataUnnamedObject,
    [1]: Buffer;
}

// exported for usage in Client class
export interface IBaseTxObjectWithBuffers extends ISignableObjectWithBuffer {
    data: ICommonParentTxDataObjectWithBuffers,
    signature: Buffer;
}

/**
 * Structure returned by Transaction.toObject() method.
 */
export interface IBaseTxObject extends ISignableObject {
    data: ICommonParentTxDataObject,
    signature: Uint8Array;
}

/**
 * Class for automatic transaction creation, management and transcoding
 */
export class Transaction extends Signable {
    protected _data: CommonParentTxData;

    constructor(schema: TTxSchemaType = '', hash: TKeyGenAlgorithmValidHashValues = defaultSignHash) {
        super(hash);
        if ( schema !== '' && SCHEMA_MAP.has(schema)) {
            this._data = SCHEMA_MAP.get(schema)();
        } else {
            this._data = new CommonParentTxData(schema);
        }
    }

    /**
     * Converts transaction to a compact object with unnamed members
     * @returns - object, throws otherwise
     */
    public toUnnamedObject(): Promise<IBaseTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: ICommonParentTxDataUnnamedObject) => {
                    const resultObj: IBaseTxUnnamedObject = [
                        unnamedData,
                        this._signature,
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts transaction to an object with binary members represented by Buffers
     * @returns - object, throws otherwise
     */
    public toObjectWithBuffers(): Promise<IBaseTxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this._data.toObjectWithBuffers()
                .then((dataObj: ICommonParentTxDataObjectWithBuffers) => {
                    const resultObj: IBaseTxObjectWithBuffers = {
                        data: dataObj,
                        signature: this._signature,
                    };
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts transaction to an object with binary members represented by Uint8Array
     * @returns - object, throws otherwise
     */
    public toObject(): Promise<IBaseTxObject> {
        return new Promise((resolve, reject) => {
            this._data.toObject()
                .then((dataObj: ICommonParentTxDataObject) => {
                    const resultObj: IBaseTxObject = {
                        data: dataObj,
                        signature: new Uint8Array(this._signature),
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts a compact object with unnamed members to a transaction
     * @param passedObj - compact object
     * @returns - true, throws otherwise
     */
    public fromUnnamedObject(passedObj: ITxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.schema = passedObj[0][0];
            this._data.accountId = passedObj[0][1];
            this._data.maxFuel = passedObj[0][2];
            this._data.nonce = passedObj[0][3];
            this._data.networkName = passedObj[0][4];
            this._data.smartContractHash = passedObj[0][5];
            this._data.smartContractMethod = passedObj[0][6];
            let keyParamsId: string = passedObj[0][7][0];
            if (passedObj[0][7][1].length > 0) {
                keyParamsId += `_${passedObj[0][7][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this._data.signerPublicKey = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this._data.smartContractMethodArgs = passedObj[0][8];
            this._signature = passedObj[1];
            if (keyParamsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this._data.signerPublicKey.importBin(new Uint8Array(passedObj[0][7][2]))
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts an object with buffers to a transaction
     * @param passedObj - object with buffers
     * @returns - true, throws otherwise
     */
    public fromObjectWithBuffers(passedObj: ITxObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObject: ITxUnnamedObject = [
                [
                    passedObj.data.schema,
                    passedObj.data.account,
                    passedObj.data.maxFuel,
                    passedObj.data.nonce,
                    passedObj.data.network,
                    passedObj.data.contract ? passedObj.data.contract : null,
                    passedObj.data.method,
                    [
                        passedObj.data.caller.type,
                        passedObj.data.caller.curve,
                        passedObj.data.caller.value,
                    ],
                    passedObj.data.args,
                ],
                passedObj.signature,
            ];
            this.fromUnnamedObject(unnamedObject)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts an object with Uint8Arrays to a transaction
     * @param passedObj - object with Uint8Arrays
     * @returns - true, throws otherwise
     */
    public fromObject(passedObj: ITxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const objBuffers: ITxObjectWithBuffers = {
                data: {
                    schema: passedObj.data.schema,
                    account: passedObj.data.account,
                    maxFuel: passedObj.data.maxFuel,
                    nonce: Buffer.from(passedObj.data.nonce),
                    network: passedObj.data.network,
                    contract: passedObj.data.contract ? Buffer.from(passedObj.data.contract) : null,
                    method: passedObj.data.method,
                    caller: {
                        type: passedObj.data.caller.type,
                        curve: passedObj.data.caller.curve,
                        value: Buffer.from(passedObj.data.caller.value),
                    },
                    args: Buffer.from(passedObj.data.args),
                },
                signature: Buffer.from(passedObj.signature),
            };
            this.fromObjectWithBuffers(objBuffers)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Signs transaction with private key, provided by
     * the gived key pair. This also automativcally sets
     * signerPublicKey of this transaction
     */
    public sign(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            privateKey.extractPublic()
                .then((publicKey: BaseECKey) => {
                    this.signerPublicKey = publicKey;
                    super.sign(privateKey)
                        .then(() => {
                            return resolve(true);
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

    /** Verifies if transaction has a valid signature produced
     * by the private key associated with signerPublicKey
     */
    public verify(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            super.verifySignature(this._data.signerPublicKey)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Computes the transaction ticket which would be returned by blockchain itself on transaction submission
     * @returns - ticket string
     */
     public getTicket(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedTx: ITxUnnamedObject) => {
                    try {
                        let dataHash = sha256(objectToBytes(unnamedTx[0]));
                        return resolve(`1220${Buffer.from(dataHash).toString('hex')}`);
                    } catch (error) {
                        return reject(error);
                    }
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
