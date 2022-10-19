import {
    TTxSchemaType,
    TxSchemas,
    SCHEMA_TO_TYPE_TAG_MAP,
} from './commonParentTxData';
import {
    BaseTxData,
    IBaseTxDataUnnamedObject,
    IBaseTxDataObjectWithBuffers,
    IBaseTxDataObject,
} from './baseTxData';

const EMPTY_SCHEMA = TxSchemas.BULK_EMPTY_ROOT_TX;
const DEFAULT_SCHEMA = TxSchemas.BULK_ROOT_TX;

export class BulkRootTxData extends BaseTxData {
    public static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    constructor(schema: TTxSchemaType = DEFAULT_SCHEMA) {
        super(schema);
    }

    public isEmpty(): boolean {
        if ((!this._account || this._account.length)
            && (!this._contract || !this._contract.byteLength)
            && (!this.smartContractMethod || !this.smartContractMethod.length)
            && (!this.smartContractMethodArgsBytes || !this.smartContractMethodArgsBytes.byteLength)
        ) {
            return true;
        }
        return false;
    }

    public toUnnamedObject(): Promise<IBaseTxDataUnnamedObject> {
        return new Promise((resolve, reject) => {
            if (this.isEmpty() && this._schema !== EMPTY_SCHEMA) {
                this._schema = EMPTY_SCHEMA;
                this._typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(EMPTY_SCHEMA)!;
            }
            super.toUnnamedObject()
                .then((superResult: IBaseTxDataUnnamedObject) => {
                    return resolve(superResult);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObjectWithBuffers(): Promise<IBaseTxDataObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            if (this.isEmpty() && this._schema !== EMPTY_SCHEMA) {
                this._schema = EMPTY_SCHEMA;
                this._typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(EMPTY_SCHEMA)!;
            }
            super.toObjectWithBuffers()
                .then((superResult: IBaseTxDataObjectWithBuffers) => {
                    return resolve(superResult);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObject(): Promise<IBaseTxDataObject> {
        return new Promise((resolve, reject) => {
            if (this.isEmpty() && this._schema !== EMPTY_SCHEMA) {
                this._schema = EMPTY_SCHEMA;
                this._typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(EMPTY_SCHEMA)!;
            }
            super.toObject()
                .then((superResult) => {
                    return resolve(superResult);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObject(passedObj: IBaseTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            super.fromUnnamedObject(passedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObjectWithBuffers(passedObj: IBaseTxDataObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            super.fromObjectWithBuffers(passedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObject(passedObj: IBaseTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
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
