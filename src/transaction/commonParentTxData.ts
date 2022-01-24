import * as Errors from '../errors';
import { WebCrypto } from '../cryptography/webCrypto';
import { objectToBytes, bytesToObject, sha256 } from '../utils';
import { BaseECKey } from '../cryptography/baseECKey';

export type TTxSchemaType = string;

export namespace TxSchemas {
    export const EMPTY_TX: TTxSchemaType = '';
    export const UNITARY_TX: TTxSchemaType = 'v1';
    export const BULK_TX: TTxSchemaType = 'bv1';
    export const BULK_ROOT_TX: TTxSchemaType = 'brv1';
    export const BULK_NODE_TX: TTxSchemaType = 'bnv1';
}
// export namespace TxSchemas {
//     export const EMPTY_TX: TTxSchemaType = '';
//     export const UNITARY_TX: TTxSchemaType = 'a1c8e9e1facd23b35f31e7891a72892d260124108b4232889e839ffc08879db0';
//     export const BULK_TX: TTxSchemaType = 'dae7d4beeaf3236b180e50c8222e21119bf811bb9466f2a77ebc93f132357f9f';
//     export const BULK_ROOT_TX: TTxSchemaType = '258413fa443fe4cc735077904a02930b23ac2f32142a8b18f86e14dfcc4bcd88';
//     export const BULK_NODE_TX: TTxSchemaType = '76aa228fcde873e8eec3dc823747c62b8fdae221db93649b56f20e5656ee3327';
// }

export namespace SignableTypeTags {
    export const EMPTY_TX: string = '';
    export const UNITARY_TX: string = 'unit_tx';
    export const BULK_TX: string = 'bulk_tx';
    export const BULK_ROOT_TX: string = 'bulk_root_tx';
    export const BULK_NODE_TX: string = 'bulk_node_tx';
}

const SCHEMA_TO_TYPE_TAG_MAP = new Map<TTxSchemaType, string>();
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.EMPTY_TX, SignableTypeTags.EMPTY_TX);
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.UNITARY_TX, SignableTypeTags.UNITARY_TX);
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.BULK_TX, SignableTypeTags.BULK_TX);
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.BULK_ROOT_TX, SignableTypeTags.BULK_ROOT_TX);
SCHEMA_TO_TYPE_TAG_MAP.set(TxSchemas.BULK_NODE_TX, SignableTypeTags.BULK_NODE_TX);

const DEFAULT_SCHEMA: TTxSchemaType = TxSchemas.EMPTY_TX;

export interface ICommonParentTxDataUnnamedObject extends Array<any> {
    /** Transaction schema */
    [0]: TTxSchemaType;
    [key: number]: any;
}

export interface ICommonParentTxDataObjectWithBuffers extends Object {
    /** Transaction schema */
    schema: TTxSchemaType;
}

export interface ICommonParentTxDataObject extends Object {
    /** Transaction schema */
    schema: string;
}

export class CommonParentTxData {
    protected _typeTag: string;

    protected _schema: TTxSchemaType;

    protected _signerPubKey: BaseECKey;

    protected _account: string;

    protected _maxFuel: number;

    protected _nonce: Buffer;

    protected _network: string;

    protected _contract: Buffer | null;

    protected _method: string;

    protected _args: Buffer;

    protected _dependsOn: Buffer;

    constructor(schema: TTxSchemaType = DEFAULT_SCHEMA) {
        this._schema = schema;
        this._signerPubKey = new BaseECKey();
        this._account = '';
        this._maxFuel = 0;
        this._nonce = Buffer.from([]);
        this._network = '';
        this._contract = null;
        this._method = '';
        this._args = Buffer.from([]);
        this._dependsOn = Buffer.from([]);
        this._typeTag = SCHEMA_TO_TYPE_TAG_MAP.has(schema)
            ? SCHEMA_TO_TYPE_TAG_MAP.get(schema)!
            : SignableTypeTags.EMPTY_TX;
    }

    public set typeTag(typeTag: string) {
        this._typeTag = typeTag;
    }

    /** Reference to the schema used in this data type. */
    public get typeTag(): string {
        return this._typeTag;
    }

    /** Reference to the default schema used in this data type. */
    public static get defaultSchema(): TTxSchemaType {
        return DEFAULT_SCHEMA;
    }

    /** Reference to the schema used in this data type. */
    public get schema(): TTxSchemaType {
        return this._schema;
    }

    /** Reference to the schema used in this data type. */
    public set schema(schema: TTxSchemaType) {
        this._schema = schema;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public set accountId(id: string) {
        this._account = id;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public get accountId(): string {
        return this._account;
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    public set maxFuel(maxFuel: number) {
        if (maxFuel < 0) {
            throw new Error(Errors.FUEL_NEGATIVE);
        }
        this._maxFuel = maxFuel;
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    public get maxFuel(): number {
        return this._maxFuel;
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    public set nonce(nonce: Uint8Array) {
        if (nonce.byteLength !== 8) {
            throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        }
        this._nonce = Buffer.from(nonce);
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    public get nonce(): Uint8Array {
        return new Uint8Array(this._nonce);
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    public set nonceHex(nonce: string) {
        if (nonce.length !== 16) { // two chars for each byte
            throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        }
        this._nonce = Buffer.from(nonce, 'hex');
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    public get nonceHex(): string {
        return this._nonce.toString('hex');
    }

    /** Automatically generates and sets new random nonce. */
    public genNonce(): void {
        const newNonce = new Uint8Array(8);
        WebCrypto.getRandomValues(newNonce);
        this._nonce = Buffer.from(newNonce);
    }

    /** Name of the network to which the transaction is addressed. */
    public set networkName(networkName: string) {
        this._network = networkName;
    }

    /** Name of the network to which the transaction is addressed. */
    public get networkName(): string {
        return this._network;
    }

    /** Smart contract hash, which will be invoked on target account. */
    public set smartContractHash(hash: Uint8Array) {
        if (hash.byteLength > 0) {
            this._contract = Buffer.from(hash);
        } else {
            this._contract = null;
        }
    }

    /** Smart contract hash, which will be invoked on target account. */
    public get smartContractHash(): Uint8Array {
        if (this._contract) {
            return new Uint8Array(this._contract);
        }
        return Buffer.from([]);
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    public set smartContractHashHex(hash: string) {
        if (hash.length > 0) {
            this._contract = Buffer.from(hash, 'hex');
        } else {
            this._contract = null;
        }
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    public get smartContractHashHex(): string {
        if (this._contract) {
            return this._contract.toString('hex');
        }
        return '';
    }

    /** Smart contract hash, which will be invoked on target account. */
    public setSmartContractHash(hash: Uint8Array | string) {
        if (typeof hash === 'string') {
            this.smartContractHashHex = hash;
        } else {
            this.smartContractHash = hash;
        }
    }

    /** Method to call on the invoked smart contract */
    public set smartContractMethod(method: string) {
        this._method = method;
    }

    /** Method to call on the invoked smart contract */
    public get smartContractMethod(): string {
        return this._method;
    }

    /** Arguments that will be passed to invoked smart contract method (generic json object) */
    public set smartContractMethodArgs(passedArgs: any) {
        this._args = Buffer.from(objectToBytes(passedArgs));
    }

    /** Arguments that will be passed to invoked smart contract method (generic json object) */
    public get smartContractMethodArgs(): any {
        return bytesToObject(new Uint8Array(this._args));
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    public set smartContractMethodArgsBytes(passedArgs: Uint8Array) {
        this._args = Buffer.from(passedArgs);
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    public get smartContractMethodArgsBytes(): Uint8Array {
        return new Uint8Array(this._args);
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    public set smartContractMethodArgsHex(passedArgs: string) {
        this._args = Buffer.from(passedArgs, 'hex');
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    public get smartContractMethodArgsHex(): string {
        return this._args.toString('hex');
    }

    /** Hash of the bulk root transaction on which this one depends. */
    public set dependsOn(hash: Uint8Array) {
        this._dependsOn = Buffer.from(hash);
    }

    /** Hash of the bulk root transaction on which this one depends. */
    public get dependsOn(): Uint8Array {
        return new Uint8Array(this._dependsOn);
    }

    /** Hash of the bulk root transaction on which this one depends as hex string. */
    public set dependsOnHex(hash: string) {
        this._dependsOn = Buffer.from(hash, 'hex');
    }

    /** Hash of the bulk root transaction on which this one depends as hex string. */
    public get dependsOnHex(): string {
        return this._dependsOn.toString('hex');
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
            this._schema = unnamedObj[0];
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

    public getTicket(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
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
