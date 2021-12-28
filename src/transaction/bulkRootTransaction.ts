import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import { BaseECKey } from '../cryptography/baseECKey';
import { TxSchemas } from './commonParentTxData';
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
    IBaseTxUnnamedObjectNoTag,
} from './baseTransaction';

const DEFAULT_SCHEMA = TxSchemas.BULK_ROOT_TX;

export interface IBulkRootTxUnnamedObject extends IBaseTxUnnamedObject {
    [1]: IBaseTxDataUnnamedObject;
}

export interface IBulkRootTxUnnamedObjectNoTag extends IBaseTxUnnamedObjectNoTag {
    [0]: IBaseTxDataUnnamedObject,
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
        this._data = new BaseTxData(DEFAULT_SCHEMA);
        this._typeTag = this._data.typeTag;
    }

    public toUnnamedObject(): Promise<IBulkRootTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: IBaseTxDataUnnamedObject) => {
                    const resultObj: IBulkRootTxUnnamedObject = [
                        this._data.typeTag,
                        unnamedData,
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toUnnamedObjectNoTag(): Promise<IBulkRootTxUnnamedObjectNoTag> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: IBulkRootTxUnnamedObject) => {
                    const resultObj: IBulkRootTxUnnamedObjectNoTag = [
                        unnamedObj[1],
                    ];
                    if (unnamedObj[2]) {
                        resultObj[1] = unnamedObj[2];
                    }
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
                        type: this._data.typeTag,
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
                        type: this._data.typeTag,
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
            if (passedObj[1][0] !== DEFAULT_SCHEMA) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data.fromUnnamedObject(passedObj[1])
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = this._data.typeTag;
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObjectNoTag(passedObj: IBulkRootTxUnnamedObjectNoTag): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedArg: IBulkRootTxUnnamedObject = [
                '',
                passedObj[0],
            ];
            if (passedObj[1]) {
                unnamedArg[2] = passedObj[1];
            }
            this.fromUnnamedObject(unnamedArg)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
            return resolve(true);
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
                    if (result) {
                        this._typeTag = this._data.typeTag;
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
    public fromObject(passedObj: IBulkRootTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.fromObject(passedObj.data)
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = this._data.typeTag;
                    }
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
