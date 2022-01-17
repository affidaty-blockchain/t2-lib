import * as Errors from './errors';
import {
    objectToBytes,
    bytesToObject,
} from './utils';
import { TKeyGenAlgorithmValidHashValues } from './cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
    EmptyKeyParams,
    mKeyPairParams,
    EKeyParamsIds,
} from './cryptography/cryptoDefaults';
import { BaseECKey } from './cryptography/baseECKey';
import {
    Signable,
    ISignableUnnamedObject,
    ISignableUnnamedObjectNoTag,
    ISignableObjectWithBuffer,
    ISignableObject,
} from './signable';

const TYPE_TAG_VALUE = 'deleg';

const DEF_EXP_AFTER_SECONDS = 2592000; // 2592000 = 30 days

export interface ICapabilities {
    [key: string]: boolean,
}

interface IDelegationMainDataInternal {
    delegate: string;
    delegator: BaseECKey;
    network: string;
    target: string;
    expiration: number;
    capabilities: ICapabilities;
}

interface IUnnamedDelegator extends Array<any> {
    [0]: string; // id of the key type. Es. 'ecdsa_p384r1'
    [1]: string; // curve
    [2]: Buffer; // actual value of the public key as 'raw'
}

interface IUnnamedDelegationMainData extends Array<any> {
    [0]: string; // delegate
    [1]: IUnnamedDelegator; // delegator
    [2]: string; // network
    [3]: string; // target
    [4]: number; // expiration
    [5]: ICapabilities; // capabilities
}

/**
 * Unnamed delegation object meant for transfer.
 */
export interface IUnnamedDelegation extends ISignableUnnamedObject {
    [1]: IUnnamedDelegationMainData; // data
    [2]: Buffer; // signature
}

export interface IUnnamedDelegationNoTag extends ISignableUnnamedObjectNoTag {
    [0]: IUnnamedDelegationMainData; // data
    [1]: Buffer; // signature
}

interface IDelegatorBuffers {
    type: string; // id of the key type. E.g. 'ecdsa'
    curve: string; // curve variant. E.g. 'secp384r1'
    value: Buffer; // actual value of the public key as 'raw'
}

interface IDelegationMainDataBuffers {
    delegate: string;
    delegator: IDelegatorBuffers;
    network: string;
    target: string;
    expiration: number;
    capabilities: ICapabilities;
}

export interface IDelegationBuffers extends ISignableObjectWithBuffer {
    data: IDelegationMainDataBuffers;
    signature: Buffer;
}

interface IDelegator {
    type: string; // id of the key type. E.g. 'ecdsa'
    curve: string; // curve variant. E.g. 'secp384r1'
    value: Uint8Array; // actual value of the public key as 'raw'
}

interface IDelegationMainData {
    delegate: string;
    delegator: IDelegator;
    network: string;
    target: string;
    expiration: number;
    capabilities: ICapabilities;
}

export interface IDelegation extends ISignableObject {
    data: IDelegationMainData;
    signature: Uint8Array;
}

/**
 * Class for automatic delegation creation, management and transcoding
 */
export class Delegation extends Signable {
    protected _data: IDelegationMainDataInternal;

    /**
     * @param customExpiration - custom expiration timestamp.
     * Can be set later using this.expiration()
     * @param hash - hash algorithm used during sign process
     */
    constructor(
        customExpiration?: number,
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        this._typeTag = TYPE_TAG_VALUE;
        this._data = {
            delegate: '',
            delegator: new BaseECKey(EmptyKeyParams),
            network: '',
            target: '',
            expiration: (typeof customExpiration !== 'undefined')
                ? customExpiration
                : Math.trunc(new Date().getTime() / 1000) + DEF_EXP_AFTER_SECONDS,
            capabilities: {},
        };
    }

    /** Account which can do something with 'target' */
    public set delegate(accountId: string) {
        this._data.delegate = accountId;
    }

    /** Account which can do something with 'target' */
    public get delegate(): string {
        return this._data.delegate;
    }

    /** Account which has given to the delegate capabilities to do something on target 'target'.
     * Gets set automatically during sign() */
    public set delegator(publicKey: BaseECKey) {
        if (publicKey.type !== 'public') {
            throw new Error();
        }
        this._data.delegator = publicKey;
    }

    /** Account which has given to the delegate capabilities to do something on target 'target'.
     * Gets set automatically during sign() */
    public get delegator(): BaseECKey {
        return this._data.delegator;
    }

    /** Name of the network on which delegate can do something on target */
    public set network(network: string) {
        this._data.network = network;
    }

    /** Name of the network on which delegate can do something on target */
    public get network(): string {
        return this._data.network;
    }

    /** Account on which delegate can perform actions defined in 'capabilities' */
    public set target(target: string) {
        this._data.target = target;
    }

    /** Account on which delegate can perform actions defined in 'capabilities' */
    public get target(): string {
        return this._data.target;
    }

    /** Delegation expiration date as Unix Time Stamp */
    public set expiration(timeStamp: number) {
        this._data.expiration = timeStamp;
    }

    /** Delegation expiration date as Unix Time Stamp */
    public get expiration(): number {
        return this._data.expiration;
    }

    /** Methods which delegate can invoke on 'target' account */
    public set capabilities(caps: ICapabilities) {
        this._data.capabilities = caps;
    }

    /** Methods which delegate can invoke on 'target' account */
    public get capabilities(): ICapabilities {
        return this._data.capabilities;
    }

    /**
     * Check whether current delegation has expired.
     * @param timestamp - Unix Time Stamp. If not passed then current time is used.
     * @returns
     */
    public isExpired(timestamp: number = -1): boolean {
        const ctrlTimeStamp = timestamp >= 0 ? timestamp : Math.trunc(new Date().getTime() / 1000);
        return this._data.expiration < ctrlTimeStamp;
    }

    /**
     * Check whether 'delegate' has a certain capability on 'target' account.
     * @param method - capability you are looking for.
     * @returns
     */
    public hasCapability(method: string): boolean {
        // lets see if we can find a corresponding capability
        let result: boolean = false;
        if ( // if capabilities has '*' and it's true
            Object.prototype.hasOwnProperty.call(this._data.capabilities, '*')
            && this._data.capabilities['*']
        ) {
            result = true;
        }

        // specific capability always wins against generic '*'
        // therefore it's checked after
        if (
            Object.prototype.hasOwnProperty.call(this._data.capabilities, method)
        ) {
            result = !!this._data.capabilities[method];
        }
        return result;
    }

    /**
     * Signs delegation and automatilla sets 'delegator'
     * @param privateKey - delegator's private key
     * @returns
     */
    public sign(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            privateKey.extractPublic()
                .then((publicKey: BaseECKey) => {
                    this.delegator = publicKey;
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
     * checks if delegation is valid (signed and not expired)
     * @param timestamp - Unix Time Stamp. If not passed then current time is used
     * @returns
     */
    public verify(timestamp: number = -1): Promise<boolean> {
        return new Promise((resolve, reject) => {
            super.verifySignature(this._data.delegator)
                .then((signatureIsValid: boolean) => {
                    if (signatureIsValid) {
                        return resolve(!this.isExpired(timestamp));
                    }
                    return resolve(signatureIsValid);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts delegation to a compact object with unnamed members
     * @returns - object, throws otherwise
     */
    public toUnnamedObject(): Promise<IUnnamedDelegation> {
        return new Promise((resolve, reject) => {
            const resultObj: IUnnamedDelegation = [
                this._typeTag,
                [
                    this._data.delegate,
                    [
                        '',
                        '',
                        Buffer.from([]),
                    ],
                    this._data.network,
                    this._data.target,
                    this._data.expiration,
                    this._data.capabilities,
                ],
                this._signature,
            ];
            if (this._data.delegator.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(resultObj);
            }
            this._data.delegator.getRaw()
                .then((rawKeyBytes: Uint8Array) => {
                    const underscoreIndex = this._data.delegator.paramsId.indexOf('_');
                    if (underscoreIndex > -1) {
                        resultObj[1][1][0] = this._data.delegator.paramsId.slice(
                            0,
                            underscoreIndex,
                        );
                        resultObj[1][1][1] = this._data.delegator.paramsId.slice(
                            underscoreIndex
                            + 1,
                        );
                    } else {
                        resultObj[1][1][0] = this._data.delegator.paramsId;
                    }
                    resultObj[1][1][2] = Buffer.from(rawKeyBytes);
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toUnnamedObjectNoTag(): Promise<IUnnamedDelegationNoTag> {
        return new Promise((resolve, reject) => {
            const resultObj: IUnnamedDelegationNoTag = [
                [
                    this._data.delegate,
                    [
                        '',
                        '',
                        Buffer.from([]),
                    ],
                    this._data.network,
                    this._data.target,
                    this._data.expiration,
                    this._data.capabilities,
                ],
                this._signature,
            ];
            if (this._data.delegator.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(resultObj);
            }
            this._data.delegator.getRaw()
                .then((rawKeyBytes: Uint8Array) => {
                    const underscoreIndex = this._data.delegator.paramsId.indexOf('_');
                    if (underscoreIndex > -1) {
                        resultObj[0][1][0] = this._data.delegator.paramsId.slice(
                            0,
                            underscoreIndex,
                        );
                        resultObj[0][1][1] = this._data.delegator.paramsId.slice(
                            underscoreIndex
                            + 1,
                        );
                    } else {
                        resultObj[0][1][0] = this._data.delegator.paramsId;
                    }
                    resultObj[0][1][2] = Buffer.from(rawKeyBytes);
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts delegation to an object with binary members represented by Buffers
     * @returns - object, throws otherwise
     */
    public toObjectWithBuffers(): Promise<IDelegationBuffers> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: IUnnamedDelegation) => {
                    const resultObj: IDelegationBuffers = {
                        type: unnamedObject[0],
                        data: {
                            delegate: unnamedObject[1][0],
                            delegator: {
                                type: unnamedObject[1][1][0],
                                curve: unnamedObject[1][1][1],
                                value: unnamedObject[1][1][2],
                            },
                            network: unnamedObject[1][2],
                            target: unnamedObject[1][3],
                            expiration: unnamedObject[1][4],
                            capabilities: unnamedObject[1][5],
                        },
                        signature: unnamedObject[2],
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts delegation to an object with binary members represented by Uint8Array
     * @returns - object, throws otherwise
     */
    public toObject(): Promise<IDelegation> {
        return new Promise((resolve, reject) => {
            this.toObjectWithBuffers()
                .then((objBuffers: IDelegationBuffers) => {
                    const resultObj: IDelegation = {
                        type: objBuffers.type,
                        data: {
                            delegate: objBuffers.data.delegate,
                            delegator: {
                                type: objBuffers.data.delegator.type,
                                curve: objBuffers.data.delegator.curve,
                                value: new Uint8Array(objBuffers.data.delegator.value),
                            },
                            network: objBuffers.data.network,
                            target: objBuffers.data.target,
                            expiration: objBuffers.data.expiration,
                            capabilities: objBuffers.data.capabilities,
                        },
                        signature: new Uint8Array(objBuffers.signature),
                    };
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
                .then((unnamedObj: IUnnamedDelegationNoTag) => {
                    return resolve(objectToBytes(unnamedObj));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts a compact object with unnamed members to delegation
     * @param passedObj - compact object
     * @returns - true, throws otherwise
     */
    public fromUnnamedObject(passedObj: IUnnamedDelegation): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (typeof passedObj[0] !== 'string') {
                passedObj.unshift(TYPE_TAG_VALUE);
            }
            this._typeTag = passedObj[0];
            this._data.delegate = passedObj[1][0];
            this._data.network = passedObj[1][2];
            this._data.target = passedObj[1][3];
            this._data.expiration = passedObj[1][4];
            this._data.capabilities = passedObj[1][5];

            let keyParamsId: string = passedObj[1][1][0];
            if (passedObj[1][1][1].length > 0) {
                keyParamsId += `_${passedObj[1][1][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this._data.delegator = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this._signature = passedObj[2];
            if (this._data.delegator.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this._data.delegator.importBin(new Uint8Array(passedObj[1][1][2]))
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObjectNoTag(passedObj: IUnnamedDelegationNoTag): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.delegate = passedObj[0][0];
            this._data.network = passedObj[0][2];
            this._data.target = passedObj[0][3];
            this._data.expiration = passedObj[0][4];
            this._data.capabilities = passedObj[0][5];

            let keyParamsId: string = passedObj[0][1][0];
            if (passedObj[0][1][1].length > 0) {
                keyParamsId += `_${passedObj[0][1][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this._data.delegator = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this._signature = passedObj[1];
            if (this._data.delegator.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this._data.delegator.importBin(new Uint8Array(passedObj[0][1][2]))
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts an object with buffers to delegation
     * @param passedObj - object with buffers
     * @returns - true, throws otherwise
     */
    public fromObjectWithBuffers(passedObj: IDelegationBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObject: IUnnamedDelegation = [
                TYPE_TAG_VALUE,
                [
                    passedObj.data.delegate,
                    [
                        passedObj.data.delegator.type,
                        passedObj.data.delegator.curve,
                        passedObj.data.delegator.value,
                    ],
                    passedObj.data.network,
                    passedObj.data.target,
                    passedObj.data.expiration,
                    passedObj.data.capabilities,
                ],
                passedObj.signature,
            ];
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
     * Converts an object with Uint8Arrays to delegation
     * @param passedObj - object with Uint8Arrays
     * @returns - true, throws otherwise
     */
    public fromObject(passedObj: IDelegation): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const objBuffers: IDelegationBuffers = {
                type: TYPE_TAG_VALUE,
                data: {
                    delegate: passedObj.data.delegate,
                    delegator: {
                        type: passedObj.data.delegator.type,
                        curve: passedObj.data.delegator.curve,
                        value: Buffer.from(passedObj.data.delegator.value),
                    },
                    network: passedObj.data.network,
                    target: passedObj.data.target,
                    expiration: passedObj.data.expiration,
                    capabilities: passedObj.data.capabilities,
                },
                signature: Buffer.from(passedObj.signature),
            };
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
            const unnamedObj: IUnnamedDelegationNoTag = bytesToObject(bytes);
            this.fromUnnamedObjectNoTag(unnamedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
