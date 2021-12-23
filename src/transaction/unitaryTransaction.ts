import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
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
    BaseTransaction,
    IBaseTxUnnamedObject,
    IBaseTxObjectWithBuffers,
    IBaseTxObject,
} from './baseTransaction';

interface IUnitaryTxUnnamedObject extends IBaseTxUnnamedObject {
    [1]: IBaseTxDataUnnamedObject;
    [2]: Buffer;
}

interface IUnitaryTxObjectWithBuffers extends IBaseTxObjectWithBuffers {
    data: IBaseTxDataObjectWithBuffers;
    signature: Buffer;
}

interface IUnitaryTxObject extends IBaseTxObject {
    data: IBaseTxDataObject;
    signature: Uint8Array;
}

export class UnitaryTransaction extends BaseTransaction {
    protected _data: BaseTxData;

    constructor(
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(BaseTxData.defaultSchema, hash);
        this._data = new BaseTxData();
        this._typeTag = this._data.typeTag;
    }

    public toUnnamedObject(): Promise<IUnitaryTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: IBaseTxDataUnnamedObject) => {
                    const resultObj: IUnitaryTxUnnamedObject = [
                        this._typeTag,
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

    public toObjectWithBuffers(): Promise<IUnitaryTxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this._data.toObjectWithBuffers()
                .then((dataObj: IBaseTxDataObjectWithBuffers) => {
                    const resultObj: IUnitaryTxObjectWithBuffers = {
                        type: this._typeTag,
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
                        type: this._typeTag,
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
            if (passedObj[1][0] !== BaseTxData.defaultSchema) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data.fromUnnamedObject(passedObj[1])
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = passedObj[0];
                        this._signature = passedObj[2];
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
                        this._typeTag = passedObj.type;
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
                        this._typeTag = passedObj.type;
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
