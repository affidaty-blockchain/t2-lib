import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/base';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import {
    BaseTxData,
    IBaseTxDataUnnamedObject,
    IBaseTxDataObjectWithBuffers,
    IBaseTxDataObject,
 } from './baseTxData';
import {
    Transaction,
    IBaseTxUnnamedObject,
    IBaseTxObjectWithBuffers,
    IBaseTxObject,
} from './transaction';

interface IUnitaryTxUnnamedObject extends IBaseTxUnnamedObject {
    [0]: IBaseTxDataUnnamedObject;
    [1]: Buffer;
}

interface IUnitaryTxObjectWithBuffers extends IBaseTxObjectWithBuffers {
    data: IBaseTxDataObjectWithBuffers;
    signature: Buffer;
}

interface IUnitaryTxObject extends IBaseTxObject {
    data: IBaseTxDataObject;
    signature: Uint8Array;
}

export class UnitaryTransaction extends Transaction {
    protected _data: BaseTxData;

    constructor(
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(BaseTxData.defaultSchema, hash);
        this._data = new BaseTxData();
    }

    public toUnnamedObject(): Promise<IUnitaryTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: IBaseTxDataUnnamedObject) => {
                    const resultObj: IUnitaryTxUnnamedObject = [
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

    public toObjectWithBuffers(): Promise<IUnitaryTxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this._data.toObjectWithBuffers()
                .then((dataObj: IBaseTxDataObjectWithBuffers) => {
                    const resultObj: IUnitaryTxObjectWithBuffers = {
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

    public toObject(): Promise<IUnitaryTxObject> {
        return new Promise((resolve, reject) => {
            this._data.toObject()
                .then((dataObj: IBaseTxDataObject) => {
                    const resultObj: IUnitaryTxObject = {
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

    public fromUnnamedObject(passedObj: IUnitaryTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[0][0] !== BaseTxData.defaultSchema) {
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
    public fromObjectWithBuffers(passedObj: IUnitaryTxObjectWithBuffers): Promise<boolean> {
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
    public fromObject(passedObj: IUnitaryTxObject): Promise<boolean> {
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