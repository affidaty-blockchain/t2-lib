import { objectToBytes, sha256 } from '../utils';
import { BaseECKey } from '../cryptography/baseECKey';

export type TTxSchemaType = string;

export namespace TxSchemas {
    export const EMPTY_TX: TTxSchemaType = '';
    export const ATOMIC_TX: TTxSchemaType = 'atomicTxSchema';
    export const BULK_TX: TTxSchemaType = 'bulkTxSchema';
    export const BULK_ROOT_TX: TTxSchemaType = 'bulkRootTxSchema';
    export const BULK_NODE_TX: TTxSchemaType = 'bulkNodeTxSchema';
}

const DEFAULT_SCHEMA: TTxSchemaType = TxSchemas.EMPTY_TX;

export interface ICommonParentTxDataUnnamedObject extends Array<any> {
    /** Transaction schema */
    [0]: TTxSchemaType;
}

export interface ICommonParentTxDataObjectWithBuffers extends Object {
    /** Transaction schema */
    schema: TTxSchemaType;
}

export interface ICommonParentTxDataObject extends Object {
    /** Transaction schema */
    schema: string;
}

export interface ICommonParentTxDataInternal extends Object{
    schema: TTxSchemaType;
    toUnnamedObject(): Promise<ICommonParentTxDataUnnamedObject>;
    toObjectWithBuffers(): Promise<ICommonParentTxDataObjectWithBuffers>;
    toObject(): Promise<ICommonParentTxDataObject>;
    fromUnnamedObject(unnamedObj: ICommonParentTxDataUnnamedObject): Promise<boolean>;
    fromObjectWithBuffers(objWithBuffers: ICommonParentTxDataObjectWithBuffers): Promise<boolean>;
    fromObject(obj: ICommonParentTxDataObject): Promise<boolean>;
    sha256(): Promise<Uint8Array>;
}

export class CommonParentTxData implements ICommonParentTxDataInternal {
    protected _schema: TTxSchemaType;

    protected _signerPubKey: BaseECKey;

    constructor(schema: TTxSchemaType = DEFAULT_SCHEMA) {
        this._schema = schema;
        this._signerPubKey = new BaseECKey();
    }

    /** Reference to the default schema used in this data type. */
    public static get defaultSchema(): TTxSchemaType {
        return DEFAULT_SCHEMA;
    }

    /** Reference to the schema used in this data type. */
    public get schema(): TTxSchemaType {
        return this.schema;
    }

    /** Reference to the schema used in this data type. */
    public set schema(schema: TTxSchemaType) {
        this._schema = schema;
    }

    /** Signer's public key. */
    public set signerPublicKey(publicKey: BaseECKey) {
        this._signerPubKey = publicKey;
    }

    /** Signer's public key. */
    public get signerPublicKey(): BaseECKey {
        return this._signerPubKey;
    }

    /**
     * Exports data structure to a compact object with unnamed members,
     * ready to be encoded with msgpack.
     * and sent over the network
     * @returns - compact unnamed object
     */
    public toUnnamedObject(): Promise<ICommonParentTxDataUnnamedObject> {
        return new Promise((resolve) => {
            return resolve([this.schema]);
        });
    }

    /**
     * Exports data structure to an object with named members and binary
     * values represented by Buffers
     * @returns - object with named members and binary values represented by Buffers
     */
    public toObjectWithBuffers(): Promise<ICommonParentTxDataObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ICommonParentTxDataUnnamedObject) => {
                    return resolve(
                        {
                            schema: unnamedObject[0],
                        },
                    );
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Exports data structure to an object with named members and binary
     * values represented by Uint8Arrays
     * @returns - object with named members and binary values represented by Uint8Arrays
     */
    public toObject(): Promise<ICommonParentTxDataObject> {
        return new Promise((resolve, reject) => {
            this.toObjectWithBuffers()
                .then((objWithBuffers: ICommonParentTxDataObjectWithBuffers) => {
                    return resolve(objWithBuffers);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Imports data structure from a compact object with unnamed members
     * @returns - compact unnamed object
     */
    public fromUnnamedObject(unnamedObj: ICommonParentTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve) => {
            this.schema = unnamedObj[0];
            return resolve(true);
        });
    }

    /**
     * Imports data structure from an object with named members and binary
     * values represented by Buffers
     * @param passedObj - object with named members and binary values
     * represented by Buffers
     */
    public fromObjectWithBuffers(
        passedObj: ICommonParentTxDataObjectWithBuffers,
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.fromUnnamedObject(
                [
                    passedObj.schema,
                ],
            )
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Imports data structure from an object with named members and binary
     * values represented by Uint8Arrays
     * @param passedObj - object with named members and binary values represented by Uint8Arrays
     */
    public fromObject(passedObj: ICommonParentTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.fromObjectWithBuffers(
                {
                    schema: passedObj.schema,
                },
            )
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Computes sha256 of the serialized data structure
     * @returns - sha256 of the serialized data structure
     */
    public sha256(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ICommonParentTxDataUnnamedObject) => {
                    return resolve(
                        sha256(
                            objectToBytes(unnamedObject),
                        ),
                    );
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
