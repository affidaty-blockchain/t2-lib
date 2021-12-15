import * as Errors from '../errors';
import { objectToBytes, sha256 } from '../utils';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/base';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import { BaseECKey } from '../cryptography/baseECKey';
import {
    TTxSchemaType,
    CommonParentTxData,
    ICommonParentTxDataUnnamedObject,
    ICommonParentTxDataObjectWithBuffers,
    ICommonParentTxDataObject,
} from './commonParentTxData';
import {
    BaseTxData,
} from './baseTxData';
import {
    Signable,
    ISignableObject,
    ISignableObjectWithBuffer,
    ISignableUnnamedObject,
} from '../signable';

const SCHEMA_MAP: Map<TTxSchemaType, ()=>CommonParentTxData> = new Map();
SCHEMA_MAP.set(CommonParentTxData.defaultSchema, () => { return new CommonParentTxData(); });
SCHEMA_MAP.set(BaseTxData.defaultSchema, () => { return new BaseTxData(); });

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

    constructor(
        schema: TTxSchemaType = CommonParentTxData.defaultSchema,
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        if (SCHEMA_MAP.has(schema)) {
            this._data = SCHEMA_MAP.get(schema)();
        } else {
            this._data = new CommonParentTxData(schema);
        }
    }

    /**
     * Exports transaction to a compact object with unnamed members,
     * ready to be encoded with msgpack
     * and sent over the network
     * @returns - compact unnamed object
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
     * Exports transaction to an object with named members and binary
     * values represented by Buffers
     * @returns - object with named members and binary values represented by Buffers
     */
    public toObjectWithBuffers(): Promise<IBaseTxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this._data.toObjectWithBuffers()
                .then((dataObj: ICommonParentTxDataObjectWithBuffers) => {
                    const resultObj: IBaseTxObjectWithBuffers = {
                        data: dataObj,
                        signature: this._signature,
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Exports transaction to an object with named members and binary
     * values represented by Uint8Arrays
     * @returns - object with named members and binary values represented by Uint8Arrays
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
     * Imports transaction from a compact object with unnamed members
     * @returns - compact unnamed object
     */
    public fromUnnamedObject(passedObj: IBaseTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!SCHEMA_MAP.has(passedObj[0][0])) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data = SCHEMA_MAP.get(passedObj[0][0])();
            this._data.fromUnnamedObject(passedObj[0])
                .then((result: boolean) => {
                    if (result) {
                        this._signature = passedObj[1];
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Imports transaction from an object with named members and binary
     * values represented by Buffers
     * @param passedObj - object with named members and binary values represented by Buffers
     */
    public fromObjectWithBuffers(passedObj: IBaseTxObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!SCHEMA_MAP.has(passedObj.data.schema)) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data = SCHEMA_MAP.get(passedObj.data.schema)();
            this._data.fromObjectWithBuffers(passedObj.data)
                .then((result: boolean) => {
                    if (result) {
                        this._signature = passedObj.signature;
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Imports transaction from an object with named members and binary
     * values represented by Uint8Arrays
     * @param passedObj - object with named members and binary values represented by Uint8Arrays
     */
    public fromObject(passedObj: IBaseTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!SCHEMA_MAP.has(passedObj.data.schema)) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data = SCHEMA_MAP.get(passedObj.data.schema)();
            this._data.fromObject(passedObj.data)
                .then((result: boolean) => {
                    if (result) {
                        this._signature = Buffer.from(passedObj.signature);
                    }
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
                    this._data.signerPublicKey = publicKey;
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
     * Computes the transaction ticket which would be returned by blockchain
     * itself on transaction submission.
     * @returns - ticket string
     */
    public getTicket(): Promise<string> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedDataObj: ICommonParentTxDataUnnamedObject) => {
                    try {
                        const dataHash = sha256(objectToBytes(unnamedDataObj));
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
