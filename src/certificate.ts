import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';
import * as Errors from './errors';
import { WebCrypto } from './cryptography/webCrypto';
import {
    numRange,
    objectToBytes,
    bytesToObject,
} from './utils';
import { TKeyGenAlgorithmValidHashValues } from './cryptography/base';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
    EmptyKeyParams,
    EKeyParamsIds,
    mKeyPairParams,
} from './cryptography/cryptoDefaults';
import { BaseECKey } from './cryptography/baseECKey';
import {
    Signable,
    ISignableUnnamedObject,
} from './signable';

const DEF_SALT_BYTE_LEN: number = 32;

function calculateSymmetryDepth(totalLeaves: number): number {
    return Math.ceil(Math.log2(totalLeaves));
}

function missingSymmetryLeaves(givenLeaves: number): number {
    return (2 ** calculateSymmetryDepth(givenLeaves)) - givenLeaves;
}

interface IMerkleData {
    root: Buffer;
    depth: number;
    multiProof: Buffer[];
}

function createMerkleTree(
    dataArray: Buffer[],
    clearIndexes: number[] = [],
): IMerkleData {
    if (dataArray.length === 0) {
        throw new Error(Errors.EMPTY_VALUE);
    }
    let sortedIndexes: number[];
    if (clearIndexes.length === 0) {
        sortedIndexes = numRange(0, dataArray.length - 1);
    } else {
        sortedIndexes = clearIndexes.sort((a, b) => { return a - b; });
    }
    if (sortedIndexes[0] < 0 || sortedIndexes[sortedIndexes.length - 1] >= dataArray.length) {
        throw new Error(Errors.MERK_WRONG_IDXS);
    }
    const [...leaves] = dataArray;

    // making merkletree symmetrical
    const missingLeaves = missingSymmetryLeaves(dataArray.length);
    for (let i = 0; i < missingLeaves; i += 1) {
        leaves.push(dataArray[dataArray.length - 1]);
    }
    const tree = new MerkleTree(leaves);
    const resultObj: IMerkleData = {
        depth: tree.getDepth(),
        root: tree.getRoot(),
        multiProof: tree.getMultiProof(clearIndexes),
    };
    return resultObj;
}

function createLeaf(valueKey: string, value: string, salt: Buffer): Buffer {
    const leaf = new Uint32Array(SHA256(`${value}${valueKey}${salt.toString('hex')}`).words);
    return Buffer.from(leaf.buffer);
}

/**
 * verifies data using hData object created with createMerkleTreeHData() function
 *
 * @link https://github.com/miguelmota/merkletreejs
 *
 * @param hData object, created with createMerkleTreeHData() function
 * @param signedFields array of strings, names of all fields of data signed by a user
 * @param passedData subobject of data, containing all fields that will be sent
 */
function verifyMerkleTree(
    dataArray: Buffer[],
    clearIndexes: number[],
    depth: number,
    root: Buffer,
    multiproof: Buffer[],
): boolean {
    const tree = new MerkleTree([]);
    return tree.verifyMultiProof(
        root,
        clearIndexes,
        dataArray,
        depth,
        multiproof,
    );
}

interface ICertMainDataInternal {
    fields: string[];
    salt: Buffer;
    root: Buffer;
    certifier: BaseECKey;
}

interface ICertifierBuffers {
    type: string; // id of the key type. E.g. 'ecdsa'
    curve: string; // curve variant. E.g. 'secp384r1'
    value: Buffer; // actual value of the public key as 'raw'
}

interface ICertMainDataBuffers {
    fields: string[];
    salt: Buffer;
    root: Buffer;
    certifier: ICertifierBuffers;
}

/**
 * Certificate object with binary members as Buffers
 */
export interface ICertBuffers {
    data: ICertMainDataBuffers;
    signature: Buffer;
    multiProof?: Buffer[];
}

interface IUnnamedCertifier extends Array<any> {
    [0]: string; // id of the key type. Es. 'ecdsa_p384r1'
    [1]: string; // curve
    [2]: Buffer; // actual value of the public key as 'raw'
}

interface IUnnamedCertMainData extends Array<any> {
    [0]: string[]; // fields
    [1]: Buffer; // salt
    [2]: Buffer; // root
    [3]: IUnnamedCertifier; //certifier
}

/**
 * Unnamed certificate object meant for transfer.
 */
export interface IUnnamedCert extends ISignableUnnamedObject {
    [0]: IUnnamedCertMainData; // data
    [1]: Buffer; // signature
    [2]?: Buffer[]; // multiProof
}

interface ICertifier {
    type: string; // id of the key type. Es. 'ecdsa_p384r1'
    curve: string; // curve variant
    value: Uint8Array; // actual value of the public key as 'raw'
}

interface ICertMainData {
    fields: string[];
    salt: Uint8Array;
    root: Uint8Array;
    certifier: ICertifier;
}

/**
 *Plain certificate object
 */
export interface ICert {
    data: ICertMainData;
    signature: Uint8Array;
    multiProof?: Uint8Array[];
}

interface IDataToCertify {
    [key: string]: string;
}

/**
 * Class for automatic certificate creation, management and transcoding
 */
export class Certificate extends Signable {
    protected _data: ICertMainDataInternal;

    protected _dataToCertify: IDataToCertify = {};

    protected _multiProof: Buffer[];

    /**
     * @param dataToCertify - Full data set with keys and values. Needed only for certificate creation and derivation. Can be set later.
     * @param hash - hash algorithm used during merkletree creation
     */
    constructor(
        dataToCertify: IDataToCertify = {},
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        this._data = {
            fields: [],
            salt: Buffer.from([]),
            root: Buffer.from([]),
            certifier: new BaseECKey(EmptyKeyParams),
        };
        this._dataToCertify = dataToCertify;
        this._multiProof = [];
    }

    /** Certified fields (keys of data)*/
    public get fields(): string[] {
        return this._data.fields;
    }

    /** Salt to append to data during merkle tree creation. */
    public set salt(salt: Uint8Array) {
        this._data.salt = Buffer.from(salt);
    }

    /** Salt to append to data during merkle tree creation. */
    public get salt(): Uint8Array {
        return new Uint8Array(this._data.salt);
    }

    /** Merkle tree root */
    public set root(root: Uint8Array) {
        this._data.root = Buffer.from(root);
    }

    /** Merkle tree root */
    public get root(): Uint8Array {
        return new Uint8Array(this._data.root);
    }

    /** Certifier's public key. Gets set automatically when signed. */
    public set certifier(publicKey: BaseECKey) {
        this._data.certifier = publicKey;
    }

    /** Certifier's public key. Gets set automatically when signed. */
    public get certifier(): BaseECKey {
        return this._data.certifier;
    }

    /** Full data set with keys and values. Needed only for certificate creation and derivation. */
    public set dataToCertify(dataToCertify: IDataToCertify) {
        this._dataToCertify = dataToCertify;
    }

    /** Full data set with keys and values. Needed only for certificate creation and derivation. */
    public get dataToCertify(): IDataToCertify {
        return this._dataToCertify;
    }

    /** Additional (not signed) data, needed for merkle tree reconstruction in partial (derived) certificates.*/
    public set multiProof(multiProof: Uint8Array[]) {
        for (let i = 0; i < multiProof.length; i += 1) {
            this._multiProof.push(Buffer.from(multiProof[i]));
        }
    }

    /** Additional (not signed) data, needed for merkle tree reconstruction in partial (derived) certificates.*/
    public get multiProof(): Uint8Array[] {
        const result: Uint8Array[] = [];
        for (let i = 0; i < this._multiProof.length; i += 1) {
            result.push(new Uint8Array(this._multiProof[i]));
        }
        return result;
    }

    /**
     * Creates (or derives) a certificate. If only a subset of keys of the full data is proviided, special 'multiproof' unsigned data will be appended to certificate in order to rebuild merkle tree.
     * @param fields - determines what data need to be provided in clear in orded to successfully verify.
     * @param generateSalt - when true, will generate missing salt automatically.
     * @returns 
     */
    public create(fields: string[] = [], generateSalt: boolean = true): boolean {
        const allKeys = Object.keys(this._dataToCertify).sort();
        if (fields.length === 0) {
            fields = allKeys;
        }
        const clearIndexes: number[] = [];
        for (let i = 0; i < fields.length; i += 1) {
            const index: number = allKeys.indexOf(fields[i]);
            if (index === -1) {
                throw new Error(Errors.CERT_WRONG_FIELDS);
            }
            if (clearIndexes.indexOf(index) === -1) {
                clearIndexes.push(index);
            }
        }
        this._data.fields = allKeys;
        if (this._data.salt.length === 0 && generateSalt) {
            const s = new Uint8Array(DEF_SALT_BYTE_LEN);
            WebCrypto.getRandomValues(s);
            this._data.salt = Buffer.from(s);
        }
        const leaves: Buffer[] = [];
        for (let i = 0; i < allKeys.length; i += 1) {
            leaves.push(createLeaf(allKeys[i], this._dataToCertify[allKeys[i]], this._data.salt));
        }
        const merkleData = createMerkleTree(leaves, clearIndexes);
        this._data.root = merkleData.root;
        this._multiProof = merkleData.multiProof;
        return true;
    }

    public toUnnamedObject(): Promise<IUnnamedCert> {
        return new Promise((resolve, reject) => {
            const resultObj: IUnnamedCert = [
                [
                    this._data.fields,
                    this._data.salt,
                    this._data.root,
                    [
                        '',
                        '',
                        Buffer.from([]),
                    ],
                ],
                this._signature,
            ];
            if (this._multiProof.length !== 0) {
                resultObj[2] = this._multiProof;
            }
            if (this._data.certifier.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(resultObj);
            }
            this._data.certifier.getRaw()
                .then((rawKeyBytes: Uint8Array) => {
                    const underscoreIndex = this._data.certifier.paramsId.indexOf('_');
                    if (underscoreIndex > -1) {
                        resultObj[0][3][0] = this._data.certifier.paramsId.slice(0, underscoreIndex)
                        resultObj[0][3][1] = this._data.certifier.paramsId.slice(underscoreIndex + 1);
                    } else {
                        resultObj[0][3][0] = this._data.certifier.paramsId;
                    }
                    resultObj[0][3][2] = Buffer.from(rawKeyBytes);
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObject(passedObj: IUnnamedCert): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.fields = passedObj[0][0];
            this._data.salt = passedObj[0][1];
            this._data.root = passedObj[0][2];

            let keyParamsId: string = passedObj[0][3][0];
            if (passedObj[0][3][1].length > 0) {
                keyParamsId += `_${passedObj[0][3][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this._data.certifier = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this._signature = passedObj[1];
            if (typeof passedObj[2] !== 'undefined') {
                for (let i = 0; i < passedObj[2].length; i += 1) {
                    this._multiProof.push(passedObj[2][i]);
                }
            }
            if (this._data.certifier.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this._data.certifier.importBin(new Uint8Array(passedObj[0][3][2]))
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObjectWithBuffers(): Promise<ICertBuffers> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: IUnnamedCert) => {
                    const resultObj: ICertBuffers = {
                        data: {
                            fields: unnamedObject[0][0],
                            salt: unnamedObject[0][1],
                            root: unnamedObject[0][2],
                            certifier: {
                                type: unnamedObject[0][3][0],
                                curve: unnamedObject[0][3][1],
                                value: unnamedObject[0][3][2],
                            },
                        },
                        signature: unnamedObject[1],
                    };
                    if (unnamedObject.length === 3) {
                        resultObj.multiProof = unnamedObject[2];
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObjectWithBuffers(passedObj: ICertBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let unnamedObject: IUnnamedCert = [
                [
                    passedObj.data.fields,
                    passedObj.data.salt,
                    passedObj.data.root,
                    [
                        passedObj.data.certifier.type,
                        passedObj.data.certifier.curve,
                        passedObj.data.certifier.value,
                    ],
                ],
                passedObj.signature,
            ]
            if (typeof passedObj.multiProof !== 'undefined') {
                unnamedObject.push(passedObj.multiProof);
            }
            this.fromUnnamedObject(unnamedObject)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Exports certificate as an easy-to-use javascript object.
     * Importable with fromObject() method.
    */
    public toObject(): Promise<ICert> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: IUnnamedCert) => {
                    const resultObj: ICert = {
                        data: {
                            fields: unnamedObject[0][0],
                            salt: new Uint8Array(unnamedObject[0][1]),
                            root: new Uint8Array(unnamedObject[0][2]),
                            certifier: {
                                type: unnamedObject[0][3][0],
                                curve: unnamedObject[0][3][1],
                                value: new Uint8Array(unnamedObject[0][3][2]),
                            },
                        },
                        signature: new Uint8Array(unnamedObject[1]),
                    };
                    if (unnamedObject.length === 3) {
                        resultObj.multiProof = unnamedObject[2];
                    }
                    resultObj.multiProof!.forEach((elem, index) => {
                        resultObj.multiProof![index] = new Uint8Array(elem);
                    })
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Imports certificate from a plain javascript object.
     * Exportable with toObject() method */
    public fromObject(passedObj: ICert): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let unnamedObject: IUnnamedCert = [
                [
                    passedObj.data.fields,
                    Buffer.from(passedObj.data.salt),
                    Buffer.from(passedObj.data.root),
                    [
                        passedObj.data.certifier.type,
                        passedObj.data.certifier.curve,
                        Buffer.from(passedObj.data.certifier.value),
                    ],
                ],
                Buffer.from(passedObj.signature),
            ]
            if (typeof passedObj.multiProof !== 'undefined') {
                unnamedObject.push(passedObj.multiProof);
            }
            this.fromUnnamedObject(unnamedObject)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Exports transaction as ready to send bytes.
     * Importable by fromBytes() method.
    */
    public toBytes(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: IUnnamedCert) => {
                    return resolve(objectToBytes(unnamedObj));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Imports transaction from bytes serialized
     * with toBytes() method */
    public fromBytes(passedBytes: Uint8Array): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObj: IUnnamedCert = bytesToObject(passedBytes);
            this.fromUnnamedObject(unnamedObj)
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Signs certificate with private key, provided by
     * the gived key pair. This also automatically sets
     * certifier of this certificate.
     * @param privateKey - signer's private key
    */
    public sign(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            privateKey.extractPublic()
                .then((publicKey: BaseECKey) => {
                    this.certifier = publicKey;
                    super.sign(privateKey)
                        .then(() => {
                            return resolve(true);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Verifies merkle tree and signature validity for provided data.
     * 
     * @param clearData - Provided data.
     * @returns
     */
    public verify(clearData: IDataToCertify = {}): Promise<boolean> {
        return new Promise((resolve, reject) => {
            super.verifySignature(this.certifier)
                .then((signatureIsValid: boolean) => {
                    if (!signatureIsValid) {
                        return resolve(signatureIsValid);
                    }
                    const clearKeys: string[] = Object.keys(clearData);
                    if (clearKeys.length === 0) {
                        if(this._data.fields.length > 0) {
                            return reject(new Error(Errors.CERT_NO_DATA_VERIFY));
                        }
                        return resolve(signatureIsValid);
                    }
                    const allKeys = this._data.fields;
                    allKeys.sort();
                    if (
                        allKeys.length !== clearKeys.length
                        && this._multiProof.length === 0
                    ) {
                        return reject(new Error(Errors.CERT_CANNOT_VERIFY));
                    }
                    for (let i = 0; i < clearKeys.length; i += 1) {
                        if (allKeys.indexOf(clearKeys[i]) === -1) {
                            return reject(new Error(Errors.CERT_WRONG_FIELDS));
                        }
                    }
                    const clearLeaves: Buffer[] = [];
                    const clearIndexes: number[] = [];
                    for (let i = 0; i < allKeys.length; i += 1) {
                        if (clearKeys.indexOf(allKeys[i]) !== -1) {
                            clearIndexes.push(i);
                            clearLeaves.push(
                                createLeaf(
                                    allKeys[i],
                                    clearData[allKeys[i]],
                                    this._data.salt,
                                ),
                            );
                        }
                    }
                    const result = verifyMerkleTree(
                        clearLeaves,
                        clearIndexes,
                        calculateSymmetryDepth(allKeys.length),
                        this._data.root,
                        this._multiProof,
                    );
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
