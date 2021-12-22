import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import { BaseECKey } from '../cryptography/baseECKey';
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

export interface IBulkRootTxUnnamedObject extends IBaseTxUnnamedObject {
    [1]: IBaseTxDataUnnamedObject;
}

export interface IBulkRootTxObjectWithBuffers extends IBaseTxObjectWithBuffers {
    data: IBaseTxDataObjectWithBuffers;
}

export interface IBulkRootTxObject extends IBaseTxObject {
    data: IBaseTxDataObject;
}

export class BulkRootTransaction extends BaseTransaction {
    protected _data: BaseTxData;

    constructor(
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(BaseTxData.defaultSchema, hash);
        this._data = new BaseTxData();
        this._typeTag = this._data.typeTag;
    }

    public toUnnamedObject(): Promise<IBulkRootTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: IBaseTxDataUnnamedObject) => {
                    const resultObj: IBulkRootTxUnnamedObject = [
                        this._typeTag,
                        unnamedData,
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObjectWithBuffers(): Promise<IBulkRootTxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this._data.toObjectWithBuffers()
                .then((dataObj: IBaseTxDataObjectWithBuffers) => {
                    const resultObj: IBulkRootTxObjectWithBuffers = {
                        type: this._typeTag,
                        data: dataObj,
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObject(): Promise<IBulkRootTxObject> {
        return new Promise((resolve, reject) => {
            this._data.toObject()
                .then((dataObj: IBaseTxDataObject) => {
                    const resultObj: IBulkRootTxObject = {
                        type: this._typeTag,
                        data: dataObj,
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObject(passedObj: IBulkRootTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[1][0] !== BaseTxData.defaultSchema) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data.fromUnnamedObject(passedObj[1])
                .then((result: boolean) => {
                    this._typeTag = passedObj[0];
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
    public fromObjectWithBuffers(passedObj: IBulkRootTxObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.fromObjectWithBuffers(passedObj.data)
                .then((result: boolean) => {
                    this._typeTag = passedObj.type;
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
    public fromObject(passedObj: IBulkRootTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.fromObject(passedObj.data)
                .then((result: boolean) => {
                    this._typeTag = passedObj.type;
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /* eslint-disable class-methods-use-this */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public sign(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            return reject(new Error(Errors.BULK_ROOT_TX_NO_SIGN));
        });
    }

    public verify(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            return reject(new Error(Errors.BULK_ROOT_TX_NO_VERIFY));
        });
    }
    /* eslint-enable class-methods-use-this */
}
