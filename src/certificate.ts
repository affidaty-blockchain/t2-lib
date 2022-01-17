import { MerkleTree } from 'merkletreejs';
import * as Errors from './errors';
import { WebCrypto } from './cryptography/webCrypto';
import { stringToArrayBuffer } from './binConversions';
import {
    sha256,
    numRange,
    objectToBytes,
    bytesToObject,
} from './utils';
import { TKeyGenAlgorithmValidHashValues } from './cryptography/baseTypes';
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
    ISignableUnnamedObjectNoTag,
    ISignableObjectWithBuffer,
    ISignableObject,
} from './signable';

const TYPE_TAG_VALUE = 'cert';

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
    const leafStr = `${value}${valueKey}${salt.toString('hex')}`;
    const hash = sha256(new Uint8Array(stringToArrayBuffer(leafStr)));
    return Buffer.from(hash);
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
    target: string;
    fields: string[];
    salt: Buffer;
    root: Buffer;
    certifier: BaseECKey;
}

interface IUnnamedCertifier extends Array<any> {
    [0]: string; // id of the key type. Es. 'ecdsa'
    [1]: string; // curve
    [2]: Buffer; // actual value of the public key as 'raw'
}

interface IUnnamedCertMainData extends Array<any> {
    [0]: string; // target
    [1]: string[]; // fields
    [2]: Buffer; // salt
    [3]: Buffer; // root
    [4]: IUnnamedCertifier; // certifier
}

/**
 * Unnamed certificate object meant for transfer.
 */
export interface IUnnamedCert extends ISignableUnnamedObject {
    [1]: IUnnamedCertMainData; // data
    [2]: Buffer; // signature
    [3]?: Buffer[]; // multiProof
}

export interface IUnnamedCertNoTag extends ISignableUnnamedObjectNoTag {
    [0]: IUnnamedCertMainData; // data
    [1]: Buffer; // signature
    [2]?: Buffer[]; // multiProof
}

interface ICertifierBuffers {
    type: string; // id of the key type. E.g. 'ecdsa'
    curve: string; // curve variant. E.g. 'secp384r1'
    value: Buffer; // actual value of the public key as 'raw'
}

interface ICertMainDataBuffers {
    target: string;
    fields: string[];
    salt: Buffer;
    root: Buffer;
    certifier: ICertifierBuffers;
}

/**
 * Certificate object with binary members as Buffers
 */
export interface ICertBuffers extends ISignableObjectWithBuffer {
    data: ICertMainDataBuffers;
    signature: Buffer;
    multiProof?: Buffer[];
}

interface ICertifier {
    type: string; // id of the key type. Es. 'ecdsa_p384r1'
    curve: string; // curve variant
    value: Uint8Array; // actual value of the public key as 'raw'
}

interface ICertMainData {
    target: string;
    fields: string[];
    salt: Uint8Array;
    root: Uint8Array;
    certifier: ICertifier;
}

/**
 *Plain certificate object
 */
export interface ICert extends ISignableObject {
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
     * @param dataToCertify - Full data set with keys and values. Needed only for certificate
     * creation and derivation. Can be set later.
     * @param hash - hash algorithm used during merkletree creation
     */
    constructor(
        dataToCertify: IDataToCertify = {},
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        this._typeTag = TYPE_TAG_VALUE;
        this._data = {
            target: '',
            fields: [],
            salt: Buffer.from([]),
            root: Buffer.from([]),
            certifier: new BaseECKey(EmptyKeyParams),
        };
        this._dataToCertify = dataToCertify;
        this._multiProof = [];
    }

    /** Certified fields (keys of data) */
    public set fields(newFields: string[]) {
        this._data.fields = newFields;
    }

    /** Certified fields (keys of data) */
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

    /** Id of the account, whose data are getting certified */
    public set target(target: string) {
        this._data.target = target;
    }

    /** Id of the account, whose data are getting certified */
    public get target(): string {
        return this._data.target;
    }

    /** Full data set with keys and values. Needed only for certificate creation and derivation. */
    public set dataToCertify(dataToCertify: IDataToCertify) {
        this._dataToCertify = dataToCertify;
    }

    /** Full data set with keys and values. Needed only for certificate creation and derivation. */
    public get dataToCertify(): IDataToCertify {
        return this._dataToCertify;
    }

    /** Additional (not signed) data, needed for merkle tree reconstruction in partial (derived)
     * certificates. */
    public set multiProof(multiProof: Uint8Array[]) {
        const temp: Buffer[] = [];
        for (let i = 0; i < multiProof.length; i += 1) {
            temp.push(Buffer.from(multiProof[i]));
        }
        this._multiProof = temp;
    }

    /** Additional (not signed) data, needed for merkle tree reconstruction in partial (derived)
     * certificates. */
    public get multiProof(): Uint8Array[] {
        const result: Uint8Array[] = [];
        for (let i = 0; i < this._multiProof.length; i += 1) {
            result.push(new Uint8Array(this._multiProof[i]));
        }
        return result;
    }

    /**
     * Creates (or derives) a certificate. If only a subset of keys of the full data is provided,
     * special 'multiproof' unsigned data will be appended to certificate
     * in order to rebuild merkle tree.
     * @param fields - determines what data need to be provided in clear in orded to successfully
     * verify.
     * @param generateSalt - when true, will generate missing salt automatically.
     * @returns - true, throws otherwise
     */
    public create(fields: string[] = [], generateSalt: boolean = true): boolean {
        const allKeys = Object.keys(this._dataToCertify).sort();
        // temp variable
        let fieldsT = fields;
        if (fieldsT.length === 0) {
            fieldsT = allKeys;
        }
        const clearIndexes: number[] = [];
        for (let i = 0; i < fieldsT.length; i += 1) {
            const index: number = allKeys.indexOf(fieldsT[i]);
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

        let missingFields = 0;
        for (let i = 0; i < this._data.fields.length; i += 1) {
            if (fieldsT.indexOf(this._data.fields[i]) < 0) {
                missingFields += 1;
            }
        }
        const merkleData = createMerkleTree(leaves, clearIndexes);
        this._data.root = merkleData.root;
        this._multiProof = [];
        if (missingFields > 0) {
            this._multiProof = merkleData.multiProof;
        }
        return true;
    }

    /**
     * Converts certificate to a compact object with unnamed members
     * @returns - object, throws otherwise
     */
    public toUnnamedObject(): Promise<IUnnamedCert> {
        return new Promise((resolve, reject) => {
            const resultObj: IUnnamedCert = [
                this._typeTag,
                [
                    this._data.target,
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
                resultObj[3] = this._multiProof;
            }
            if (this._data.certifier.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(resultObj);
            }
            this._data.certifier.getRaw()
                .then((rawKeyBytes: Uint8Array) => {
                    const undrscrIndex = this._data.certifier.paramsId.indexOf('_');
                    if (undrscrIndex > -1) {
                        resultObj[1][4][0] = this._data.certifier.paramsId.slice(0, undrscrIndex);
                        resultObj[1][4][1] = this._data.certifier.paramsId.slice(undrscrIndex + 1);
                    } else {
                        resultObj[1][4][0] = this._data.certifier.paramsId;
                    }
                    resultObj[1][4][2] = Buffer.from(rawKeyBytes);
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toUnnamedObjectNoTag(): Promise<IUnnamedCertNoTag> {
        return new Promise((resolve, reject) => {
            const resultObj: IUnnamedCertNoTag = [
                [
                    this._data.target,
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
                    const undrscrIndex = this._data.certifier.paramsId.indexOf('_');
                    if (undrscrIndex > -1) {
                        resultObj[0][4][0] = this._data.certifier.paramsId.slice(0, undrscrIndex);
                        resultObj[0][4][1] = this._data.certifier.paramsId.slice(undrscrIndex + 1);
                    } else {
                        resultObj[0][4][0] = this._data.certifier.paramsId;
                    }
                    resultObj[0][4][2] = Buffer.from(rawKeyBytes);
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts certificate to an object with binary members represented by Buffers
     * @returns - object, throws otherwise
     */
    public toObjectWithBuffers(): Promise<ICertBuffers> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: IUnnamedCert) => {
                    const resultObj: ICertBuffers = {
                        type: unnamedObject[0],
                        data: {
                            target: unnamedObject[1][0],
                            fields: unnamedObject[1][1],
                            salt: unnamedObject[1][2],
                            root: unnamedObject[1][3],
                            certifier: {
                                type: unnamedObject[1][4][0],
                                curve: unnamedObject[1][4][1],
                                value: unnamedObject[1][4][2],
                            },
                        },
                        signature: unnamedObject[2],
                    };
                    if (unnamedObject.length === 4) {
                        resultObj.multiProof = unnamedObject[3];
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts certificate to an object with binary members represented by Uint8Array
     * @returns - object, throws otherwise
     */
    public toObject(): Promise<ICert> {
        return new Promise((resolve, reject) => {
            this.toObjectWithBuffers()
                .then((objBuffers: ICertBuffers) => {
                    const resultObj: ICert = {
                        type: objBuffers.type,
                        data: {
                            target: objBuffers.data.target,
                            fields: objBuffers.data.fields,
                            salt: new Uint8Array(objBuffers.data.salt),
                            root: new Uint8Array(objBuffers.data.root),
                            certifier: {
                                type: objBuffers.data.certifier.type,
                                curve: objBuffers.data.certifier.curve,
                                value: new Uint8Array(objBuffers.data.certifier.value),
                            },
                        },
                        signature: new Uint8Array(objBuffers.signature),
                    };
                    if (typeof objBuffers.multiProof !== 'undefined') {
                        resultObj.multiProof = [];
                        objBuffers.multiProof!.forEach((elem) => {
                            resultObj.multiProof!.push(new Uint8Array(elem));
                        });
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toBytes(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObjectNoTag()
                .then((unnamedObj: IUnnamedCertNoTag) => {
                    return resolve(objectToBytes(unnamedObj));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts a compact object with unnamed members to certificate
     * @param passedObj - compact object
     * @returns - true, throws otherwise
     */
    public fromUnnamedObject(passedObj: IUnnamedCert): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (typeof passedObj[0] !== 'string') {
                passedObj.unshift(TYPE_TAG_VALUE);
            }
            this._typeTag = passedObj[0];
            this._data.target = passedObj[1][0];
            this._data.fields = passedObj[1][1];
            this._data.salt = passedObj[1][2];
            this._data.root = passedObj[1][3];

            let keyParamsId: string = passedObj[1][4][0];
            if (passedObj[1][4][1].length > 0) {
                keyParamsId += `_${passedObj[1][4][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this._data.certifier = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this._signature = passedObj[2];
            if (typeof passedObj[3] !== 'undefined') {
                for (let i = 0; i < passedObj[3].length; i += 1) {
                    this._multiProof.push(passedObj[3][i]);
                }
            }
            if (this._data.certifier.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this._data.certifier.importBin(new Uint8Array(passedObj[1][4][2]))
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObjectNoTag(passedObj: IUnnamedCertNoTag): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.target = passedObj[0][0];
            this._data.fields = passedObj[0][1];
            this._data.salt = passedObj[0][2];
            this._data.root = passedObj[0][3];

            let keyParamsId: string = passedObj[0][4][0];
            if (passedObj[0][4][1].length > 0) {
                keyParamsId += `_${passedObj[0][4][1]}`;
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
            this._data.certifier.importBin(new Uint8Array(passedObj[0][4][2]))
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts an object with buffers to certificate
     * @param passedObj - object with buffers
     * @returns - true, throws otherwise
     */
    public fromObjectWithBuffers(passedObj: ICertBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObject: IUnnamedCert = [
                TYPE_TAG_VALUE,
                [
                    passedObj.data.target,
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
            ];
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

    /**
     * Converts an object with Uint8Arrays to certificate
     * @param passedObj - object with Uint8Arrays
     * @returns - true, throws otherwise
     */
    public fromObject(passedObj: ICert): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const objBuffers: ICertBuffers = {
                type: TYPE_TAG_VALUE,
                data: {
                    target: passedObj.data.target,
                    fields: passedObj.data.fields,
                    salt: Buffer.from(passedObj.data.salt),
                    root: Buffer.from(passedObj.data.root),
                    certifier: {
                        type: passedObj.data.certifier.type,
                        curve: passedObj.data.certifier.curve,
                        value: Buffer.from(passedObj.data.certifier.value),
                    },
                },
                signature: Buffer.from(passedObj.signature),
            };
            if (typeof passedObj.multiProof !== 'undefined') {
                objBuffers.multiProof = [];
                passedObj.multiProof.forEach((elem) => {
                    objBuffers.multiProof!.push(Buffer.from(elem));
                });
            }
            this.fromObjectWithBuffers(objBuffers)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromBytes(bytes: Uint8Array): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObj: IUnnamedCertNoTag = bytesToObject(bytes);
            this.fromUnnamedObjectNoTag(unnamedObj)
                .then((result) => {
                    return resolve(result);
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
     * @returns - true, throws otherwise
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
     * Verifies merkle tree and signature.
     * @param clearData - Provided data.
     * @returns - boolean
     */
    public verify(clearData: IDataToCertify = {}): Promise<boolean> {
        return new Promise((resolve, reject) => {
            super.verifySignature(this.certifier)
                .then((signatureIsValid: boolean) => {
                    if (!signatureIsValid) {
                        return resolve(signatureIsValid);
                    }
                    const clearKeys: string[] = Object.keys(clearData).sort();
                    const allKeys = this._data.fields;
                    allKeys.sort();
                    if (
                        clearKeys.length !== allKeys.length
                        && (
                            this._multiProof.length === 0
                            || clearKeys.length === 0
                        )
                    ) {
                        return resolve(false);
                    }
                    for (let i = 0; i < clearKeys.length; i += 1) {
                        if (allKeys.indexOf(clearKeys[i]) === -1) {
                            return reject(new Error(Errors.CERT_WRONG_FIELDS));
                        }
                    }
                    const clearLeaves: Buffer[] = [];
                    const clearIndexes: number[] = [];
                    let missingFields = 0;
                    for (let i = 0; i < allKeys.length; i += 1) {
                        if (clearKeys.indexOf(allKeys[i]) >= 0) {
                            clearIndexes.push(i);
                            clearLeaves.push(
                                createLeaf(
                                    allKeys[i],
                                    clearData[allKeys[i]],
                                    this._data.salt,
                                ),
                            );
                        } else {
                            missingFields += 1;
                        }
                    }

                    if (missingFields === 0
                        && this._multiProof.length === 0
                    ) {
                        const missingSymLeaves = missingSymmetryLeaves(clearLeaves.length);
                        const leafToDublicate = clearLeaves.length - 1;
                        for (let i = 0; i < missingSymLeaves; i += 1) {
                            clearLeaves.push(clearLeaves[leafToDublicate]);
                            clearIndexes.push(clearLeaves.length - 1);
                        }
                    }

                    let result = false;
                    try {
                        result = verifyMerkleTree(
                            clearLeaves,
                            clearIndexes,
                            calculateSymmetryDepth(allKeys.length),
                            this._data.root,
                            this._multiProof,
                        );
                    } catch (error) {
                        result = false;
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
