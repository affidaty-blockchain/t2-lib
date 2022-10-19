import {
    TTxSchemaType,
    TxSchemas,
    SCHEMA_TO_TYPE_TAG_MAP,
    ICommonParentTxDataUnnamedObject,
} from './commonParentTxData';
import {
    BaseTxData,
    IBaseTxDataUnnamedObject,
    IBaseTxDataObjectWithBuffers,
    IBaseTxDataObject,
    IBaseTxDataPublicKeyUnnamedObject,
} from './baseTxData';

const EMPTY_SCHEMA = TxSchemas.BULK_EMPTY_ROOT_TX;
const DEFAULT_SCHEMA = TxSchemas.BULK_ROOT_TX;

export interface TEmptyBulkRootTxDataUnnamedObject extends ICommonParentTxDataUnnamedObject {
    /** Max fuel that consumable by this transaction */
    [1]: number;
    /** Nonce */
    [2]: Buffer;
    /** Network name */
    [4]: string;
    /** Signer's public key */
    [5]: IBaseTxDataPublicKeyUnnamedObject;
}

export class BulkRootTxData extends BaseTxData {
    public static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    constructor(schema: TTxSchemaType = DEFAULT_SCHEMA) {
        super(schema);
    }

    public isEmpty(): boolean {
        if ((!this._account || !this._account.length)
            && (!this._contract || !this._contract.byteLength)
            && (!this.smartContractMethod || !this.smartContractMethod.length)
            && (!this.smartContractMethodArgsBytes || !this.smartContractMethodArgsBytes.byteLength)
        ) {
            return true;
        }
        return false;
    }

    public toUnnamedObject(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.isEmpty() && this._schema !== EMPTY_SCHEMA) {
                this._schema = EMPTY_SCHEMA;
                this._typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(EMPTY_SCHEMA)!;
            }
            super.toUnnamedObject()
                .then((superResult: IBaseTxDataUnnamedObject) => {
                    if (this.isEmpty()) {
                        return resolve([
                            superResult[0],
                            superResult[2],
                            superResult[3],
                            superResult[4],
                            superResult[7],
                        ]);
                    }
                    return resolve(superResult);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObjectWithBuffers(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.isEmpty() && this._schema !== EMPTY_SCHEMA) {
                this._schema = EMPTY_SCHEMA;
                this._typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(EMPTY_SCHEMA)!;
            }
            this.toUnnamedObject()
                .then((unnamedObject: any) => {
                    if (this.isEmpty()) {
                        return resolve({
                            schema: unnamedObject[0],
                            maxFuel: unnamedObject[1],
                            nonce: unnamedObject[2],
                            network: unnamedObject[3],
                            caller: {
                                type: unnamedObject[4][0],
                                curve: unnamedObject[4][1],
                                value: unnamedObject[4][2],
                            },
                        });
                    }
                    return resolve({
                        schema: unnamedObject[0],
                        account: unnamedObject[1],
                        maxFuel: unnamedObject[2],
                        nonce: unnamedObject[3],
                        network: unnamedObject[4],
                        contract: unnamedObject[5],
                        method: unnamedObject[6],
                        caller: {
                            type: unnamedObject[7][0],
                            curve: unnamedObject[7][1],
                            value: unnamedObject[7][2],
                        },
                        args: unnamedObject[8],
                    });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObject(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.isEmpty() && this._schema !== EMPTY_SCHEMA) {
                this._schema = EMPTY_SCHEMA;
                this._typeTag = SCHEMA_TO_TYPE_TAG_MAP.get(EMPTY_SCHEMA)!;
            }
            this.toObjectWithBuffers()
                .then((objBuffers: any) => {
                    if (this.isEmpty()) {
                        return resolve({
                            schema: objBuffers.schema,
                            maxFuel: objBuffers.maxFuel,
                            nonce: new Uint8Array(objBuffers.nonce),
                            network: objBuffers.network,
                            caller: {
                                type: objBuffers.caller.type,
                                curve: objBuffers.caller.curve,
                                value: new Uint8Array(objBuffers.caller.value),
                            },
                        });
                    }
                    return resolve({
                        schema: objBuffers.schema,
                        account: objBuffers.account,
                        maxFuel: objBuffers.maxFuel,
                        nonce: new Uint8Array(objBuffers.nonce),
                        network: objBuffers.network,
                        contract: objBuffers.contract ? new Uint8Array(objBuffers.contract) : null,
                        method: objBuffers.method,
                        caller: {
                            type: objBuffers.caller.type,
                            curve: objBuffers.caller.curve,
                            value: new Uint8Array(objBuffers.caller.value),
                        },
                        args: new Uint8Array(objBuffers.args),
                    });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObject(passedObj: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const tempPassedObj: IBaseTxDataUnnamedObject = passedObj.length > 5
                ? passedObj
                : [
                    passedObj[0],
                    '',
                    passedObj[1],
                    passedObj[2],
                    passedObj[3],
                    null,
                    '',
                    passedObj[4],
                    Buffer.from([]),
                ];
            super.fromUnnamedObject(tempPassedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObjectWithBuffers(passedObj: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const tempPassedObj: IBaseTxDataObjectWithBuffers = Object.keys(passedObj).length > 5
                ? passedObj
                : {
                    schema: passedObj.schema,
                    account: '',
                    maxFuel: passedObj.maxFuel,
                    nonce: passedObj.nonce,
                    network: passedObj.network,
                    contract: null,
                    method: '',
                    caller: passedObj.caller,
                    args: Buffer.from([]),
                };
            super.fromObjectWithBuffers(tempPassedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObject(passedObj: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const tempPassedObj: IBaseTxDataObject = Object.keys(passedObj).length > 5
                ? passedObj
                : {
                    schema: passedObj.schema,
                    account: '',
                    maxFuel: passedObj.maxFuel,
                    nonce: passedObj.nonce,
                    network: passedObj.network,
                    contract: null,
                    method: '',
                    caller: passedObj.caller,
                    args: new Uint8Array([]),
                };
            super.fromObject(tempPassedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
