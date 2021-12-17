import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/base';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import { TTxSchemaType } from './commonParentTxData';
import {
    BulkNodeTxData,
    IBulkNodeTxDataUnnamedObject,
    IBulkNodeTxDataObjectWithBuffers,
    IBulkNodeTxDataObject,
 } from './bulkNodeTxData';
import {
    Transaction,
    IBaseTxUnnamedObject,
    IBaseTxObjectWithBuffers,
    IBaseTxObject,
} from './transaction';

interface IBulkNodeTxUnnamedObject extends IBaseTxUnnamedObject {
    [0]: IBulkNodeTxDataUnnamedObject;
    [1]: Buffer;
}

interface IBulkNodeTxObjectWithBuffers extends IBaseTxObjectWithBuffers {
    data: IBulkNodeTxDataObjectWithBuffers;
    signature: Buffer;
}

interface IBulkNodeTxObject extends IBaseTxObject {
    data: IBulkNodeTxDataObject;
    signature: Uint8Array;
}

export class UnitaryTransaction extends Transaction {
    protected _data: BulkNodeTxData;

    constructor(
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(BulkNodeTxData.defaultSchema, hash);
        this._data = new BulkNodeTxData();
    }

    public toUnnamedObject(): Promise<IBulkNodeTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: IBulkNodeTxDataUnnamedObject) => {
                    const resultObj: IBulkNodeTxUnnamedObject = [
                        unnamedData,
                        this._signature
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObjectWithBuffers(): Promise<IBulkNodeTxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this._data.toObjectWithBuffers()
                .then((dataObj: IBulkNodeTxDataObjectWithBuffers) => {
                    const resultObj: IBulkNodeTxObjectWithBuffers = {
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

    public toObject(): Promise<IBulkNodeTxObject> {
        return new Promise((resolve, reject) => {
            this._data.toObject()
                .then((dataObj: IBulkNodeTxDataObject) => {
                    const resultObj: IBulkNodeTxObject = {
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

    public fromUnnamedObject(passedObj: IBulkNodeTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[0][0] !== BulkNodeTxData.defaultSchema) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
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
    public fromObjectWithBuffers(passedObj: IBulkNodeTxObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
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
    public fromObject(passedObj: IBulkNodeTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
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
}