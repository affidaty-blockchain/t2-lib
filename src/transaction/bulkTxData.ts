import {
    TTxSchemaType,
    TxSchemas,
} from './commonParentTxData';
import {
    CommonParentTxData,
    ICommonParentTxDataUnnamedObject,
    ICommonParentTxDataObjectWithBuffers,
    ICommonParentTxDataObject,
} from './commonParentTxData';
import { BulkRootTransaction } from './bulkRootTransaction';
import { BulkNodeTransaction } from './bulkNodeTransaction';

const DEFAULT_SCHEMA = TxSchemas.BULK_TX;

interface txList extends Array<BulkRootTransaction | BulkNodeTransaction> {
    [0]: BulkRootTransaction;
    [key: number]: BulkRootTransaction | BulkNodeTransaction
}

interface IBulkNodeTxDataUnnamedObject extends ICommonParentTxDataUnnamedObject {
    /** Hash of the bulk root transaction on which this one depends. */
    [1]: txList;
}

interface IBulkNodeTxDataObjectWithBuffers extends ICommonParentTxDataObjectWithBuffers {
    /** Hash of the bulk root transaction on which this one depends. */
    txs: txList;
}

interface IBulkNodeTxDataObject extends ICommonParentTxDataObject {
    /** Hash of the bulk root transaction on which this one depends. */
    txs: txList;
}

export class BulkNodeTxData extends BaseTxData {
    public static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    constructor(schema: TTxSchemaType = DEFAULT_SCHEMA) {
        super(schema);
    }

    public toUnnamedObject(): Promise<IBulkNodeTxDataUnnamedObject> {
        return new Promise((resolve, reject) => {
            super.toUnnamedObject()
                .then((superResult: IBaseTxDataUnnamedObject) => {
                    const resultObj: IBulkNodeTxDataUnnamedObject = [
                        superResult[0],
                        superResult[1],
                        superResult[2],
                        superResult[3],
                        superResult[4],
                        superResult[5],
                        superResult[6],
                        superResult[7],
                        superResult[8],
                        this._dependsOn,
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObjectWithBuffers(): Promise<IBulkNodeTxDataObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            super.toObjectWithBuffers()
                .then((superResult: IBaseTxDataObjectWithBuffers) => {
                    const resultObj: IBulkNodeTxDataObjectWithBuffers = {
                        ...superResult,
                        dependsOn: this._dependsOn,
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObject(): Promise<IBulkNodeTxDataObject> {
        return new Promise((resolve, reject) => {
            super.toObject()
                .then((superResult: IBaseTxDataObject) => {
                    const resultObj: IBulkNodeTxDataObject = {
                        ...superResult,
                        dependsOn: new Uint8Array(this._dependsOn),
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObject(passedObj: IBulkNodeTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[9]) {
                this._dependsOn = passedObj[9];
            }
            super.fromUnnamedObject(passedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObjectWithBuffers(passedObj: IBulkNodeTxDataObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj.dependsOn) {
                this._dependsOn = passedObj.dependsOn;
            }
            super.fromObjectWithBuffers(passedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObject(passedObj: IBulkNodeTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj.dependsOn) {
                this._dependsOn = Buffer.from(passedObj.dependsOn);
            }
            super.fromObject(passedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
