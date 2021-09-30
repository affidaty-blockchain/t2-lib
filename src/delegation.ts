// import * as Errors from './errors';
import {
    objectToBytes,
    bytesToObject,
} from './utils';
import { TKeyGenAlgorithmValidHashValues } from './cryptography/base';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
    EmptyKeyParams,
    mKeyPairParams,
    EKeyParamsIds,
} from './cryptography/cryptoDefaults';
import { BaseECKey } from './cryptography/baseECKey';
import {
    Signable,
} from './signable';

const DEF_EXP_AFTER_SECONDS = 2592000; // 2592000 = 30 days

const dlgCapStr = 'delegate'; // capabilities management capability name
type capsList = { [key: string]: boolean }
export interface ICapabilities {
    [key: string]: {
        [key: string]: undefined | boolean | capsList,
        [dlgCapStr]?: capsList,
    };
}

interface IDelegationMainDataInternal {
    delegate: string;
    delegator: BaseECKey;
    network: string;
    expiration: number;
    capabilities: ICapabilities;
}

interface IDelegatorBuffers {
    type: string; // id of the key type. Es. 'ecdsa_p384r1'
    value: Buffer; // actual value of the public key as 'raw'
}

interface IDelegationMainDataBuffers {
    delegate: string;
    delegator: IDelegatorBuffers;
    network: string;
    expiration: number;
    capabilities: ICapabilities;
}

export interface IDelegationBuffers {
    data: IDelegationMainDataBuffers;
    signature: Buffer;
    parent?: IDelegationBuffers;
}

interface IEntity {
    type: string; // id of the key type. Es. 'ecdsa_p384r1'
    value: Uint8Array; // actual value of the public key as 'raw'
}

interface IDelegationMainData {
    delegate: string;
    delegator: IEntity;
    network: string;
    expiration: number;
    capabilities: ICapabilities;
}

export interface IDelegation {
    data: IDelegationMainData;
    signature: Uint8Array;
    parent?: IDelegation;
}

/**
 * Performs capabilities comparison to check whether an entity with parent
 * capabilities could have assigned child capabilities to another entity
 * @param child - Child capabilities.
 * @param parent - Source capabilities.
 * @return - True if capabilities are consistent, Error(message) otherwise
 */
export function compareCapabilities(
    parent: ICapabilities,
    child: ICapabilities,
    parentId: string = 'parent',
    childId: string = 'child',
) {
    const cAccs = Object.keys(child); // child accounts array
    const pAccs = Object.keys(parent); // parent accounts array
    cAccs.forEach((cAcc) => {
        if (cAcc === '*') {
            pAccs.forEach((pAcc) => {
                if (!Object.prototype.hasOwnProperty.call(child, pAcc)) {
                    throw new Error(`Capabilities escalation in ${childId}.`);
                }
            });
        }
        let pAcc: any = null;
        if (Object.prototype.hasOwnProperty.call(parent, '*')) {
            pAcc = '*';
        }
        if (Object.prototype.hasOwnProperty.call(parent, cAcc)) {
            pAcc = cAcc;
        }
        if (!pAcc || !parent[pAcc]) {
            throw new Error(`${parentId} has no capabilities for ${cAcc}.`);
        }
        const cCaps = Object.keys(child[cAcc]);
        cCaps.forEach((cCap) => {
            if (cCap === '*') {
                if (
                    !Object.prototype.hasOwnProperty.call(parent[pAcc], dlgCapStr)
                    || !parent[pAcc][dlgCapStr]
                ) {
                    throw new Error(`${parentId} has no delegation capability for ${pAcc}.`);
                }
                const pDelegCaps = Object.keys(parent[pAcc][dlgCapStr]!);
                pDelegCaps.forEach((pDelegCap) => {
                    if (
                        !(parent[pAcc][dlgCapStr]![pDelegCap])
                        && (
                            typeof child[cAcc][pDelegCap] === 'undefined'
                            || child[cAcc][pDelegCap]
                        )
                    ) {
                        throw new Error(`Capabilities escalation in ${childId}.`);
                    }
                });
            }
            let pCap: any = null;
            if (Object.prototype.hasOwnProperty.call(parent[pAcc], dlgCapStr)) {
                if (!parent[pAcc][dlgCapStr]) {
                    throw new Error(`${parentId} has no delegation capability for ${pAcc}.`);
                }
                if (Object.prototype.hasOwnProperty.call(parent[pAcc][dlgCapStr], '*')) {
                    pCap = '*';
                }
                if (Object.prototype.hasOwnProperty.call(parent[pAcc][dlgCapStr], cCap)) {
                    pCap = cCap;
                }
                if (!parent[pAcc][dlgCapStr]![pCap]) {
                    pCap = null;
                }
            }
            if (child[cAcc][cCap] && (!pCap || !parent[pAcc][dlgCapStr]![pCap])) {
                throw new Error(`${parentId} cannot delegate ${cCap} capability for ${cAcc}`);
            }
        });
    });
    return true;
}

/**
 * Class for automatic delegation creation, management and transcoding
 */
export class Delegation extends Signable {
    protected _data: IDelegationMainDataInternal;

    protected _parent?: Delegation;

    constructor(
        customExpiration?: number,
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        this._data = {
            delegate: '',
            delegator: new BaseECKey(EmptyKeyParams),
            network: '',
            expiration: (typeof customExpiration !== 'undefined')
                ? customExpiration
                : Math.trunc(new Date().getTime() / 1000) + DEF_EXP_AFTER_SECONDS,
            capabilities: {},
        };
    }

    public set delegate(accountId: string) {
        this._data.delegate = accountId;
    }

    public get delegate(): string {
        return this._data.delegate;
    }

    public set delegator(publicKey: BaseECKey) {
        if (publicKey.type !== 'public') {
            throw new Error();
        }
        this._data.delegator = publicKey;
    }

    public get delegator(): BaseECKey {
        return this._data.delegator;
    }

    public set network(network: string) {
        this._data.network = network;
    }

    public get network(): string {
        return this._data.network;
    }

    public set expiration(timeStamp: number) {
        this._data.expiration = timeStamp;
    }

    public get expiration(): number {
        return this._data.expiration;
    }

    public set capabilities(caps: ICapabilities) {
        this._data.capabilities = caps;
    }

    public get capabilities(): ICapabilities {
        return this._data.capabilities;
    }

    public set parent(parent: Delegation | undefined) {
        this._parent = parent;
    }

    public get parent(): Delegation | undefined {
        return this._parent;
    }

    public toObjectWithBuffers(): Promise<IDelegationBuffers> {
        return new Promise((resolve, reject) => {
            const resultObj: IDelegationBuffers = {
                data: {
                    delegate: this._data.delegate,
                    delegator: {
                        type: '',
                        value: Buffer.from([]),
                    },
                    network: this._data.network,
                    expiration: this._data.expiration,
                    capabilities: this._data.capabilities,
                },
                signature: this._signature,
            };
            let exportKey = false;
            let keyIdx = 0;
            const promises: Promise<any>[] = [];
            if (this._data.delegator.paramsId !== EKeyParamsIds.EMPTY) {
                exportKey = true;
                promises.push(this._data.delegator.getRaw());
                keyIdx = promises.length - 1;
            }
            let exportParent = false;
            let parentIdx = 0;
            if (typeof this._parent !== 'undefined') {
                exportParent = true;
                promises.push(this._parent.toObjectWithBuffers());
                parentIdx = promises.length - 1;
            }
            Promise.all(promises)
                .then((resolved: any[]) => {
                    if (exportKey) {
                        resultObj.data.delegator.type = this._data.delegator.paramsId;
                        resultObj.data.delegator.value = Buffer.from(resolved[keyIdx]);
                    }
                    if (exportParent) {
                        resultObj.parent = resolved[parentIdx];
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObjectWithBuffers(passedObj: IDelegationBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.delegate = passedObj.data.delegate;
            this._data.delegator = new BaseECKey(
                mKeyPairParams.get(passedObj.data.delegator.type)!.publicKey,
            );
            this._data.network = passedObj.data.network;
            this._data.expiration = passedObj.data.expiration;
            this._data.capabilities = passedObj.data.capabilities;
            this._signature = passedObj.signature;
            const promises: Promise<any>[] = [];
            if (this._data.delegator.paramsId !== EKeyParamsIds.EMPTY) {
                promises.push(
                    this._data.delegator.setRaw(new Uint8Array(passedObj.data.delegator.value)),
                );
            }
            if (typeof passedObj.parent !== 'undefined') {
                this._parent = new Delegation();
                promises.push(this._parent.fromObjectWithBuffers(passedObj.parent!));
            }
            Promise.all(promises)
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObject(): Promise<IDelegation> {
        return new Promise((resolve, reject) => {
            const resultObj: IDelegation = {
                data: {
                    delegate: this._data.delegate,
                    delegator: {
                        type: '',
                        value: new Uint8Array(0),
                    },
                    network: this._data.network,
                    expiration: this._data.expiration,
                    capabilities: this._data.capabilities,
                },
                signature: new Uint8Array(this._signature),
            };
            let exportKey = false;
            let keyIdx = 0;
            const promises: Promise<any>[] = [];
            if (this._data.delegator.paramsId !== EKeyParamsIds.EMPTY) {
                exportKey = true;
                promises.push(this._data.delegator.getRaw());
                keyIdx = promises.length - 1;
            }
            let exportParent = false;
            let parentIdx = 0;
            if (typeof this._parent !== 'undefined') {
                exportParent = true;
                promises.push(this._parent.toObject());
                parentIdx = promises.length - 1;
            }
            Promise.all(promises)
                .then((resolved: any[]) => {
                    if (exportKey) {
                        resultObj.data.delegator.type = this._data.delegator.paramsId;
                        resultObj.data.delegator.value = new Uint8Array(resolved[keyIdx]);
                    }
                    if (exportParent) {
                        resultObj.parent = resolved[parentIdx];
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObject(passedObj: IDelegation): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.delegate = passedObj.data.delegate;
            this._data.delegator = new BaseECKey(
                mKeyPairParams.get(passedObj.data.delegator.type)!.publicKey,
            );
            this._data.network = passedObj.data.network;
            this._data.expiration = passedObj.data.expiration;
            this._data.capabilities = passedObj.data.capabilities;
            this._signature = Buffer.from(passedObj.signature);
            const promises: Promise<any>[] = [];
            if (this._data.delegator.paramsId !== EKeyParamsIds.EMPTY) {
                promises.push(
                    this._data.delegator.setRaw(passedObj.data.delegator.value),
                );
            }
            if (typeof passedObj.parent !== 'undefined') {
                this._parent = new Delegation();
                promises.push(this._parent.fromObject(passedObj.parent!));
            }
            Promise.all(promises)
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toBytes(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toObjectWithBuffers()
                .then((obj: IDelegationBuffers) => {
                    return resolve(objectToBytes(obj));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromBytes(passedBytes: Uint8Array): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const objWithBuffers: IDelegationBuffers = bytesToObject(passedBytes);
            this.fromObjectWithBuffers(objWithBuffers)
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

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

    // private verifyRecursively(rootCAId: string, delegate: string, network): Promise<boolean> {
    //     return new Promise((resolve, reject) => {
    //         super.verifySignature(this._data.delegator)
    //             .then((signatureIsValid: boolean) => {
    //                 // TODO:
    //                 // capabilities verification,
    //                 // check delegator against passed/default rootCA
    //                 // check delegate against targed(passed)
    //                 // recursive if parent is defined
    //                 return resolve(signatureIsValid);
    //             })
    //             .catch((error: any) => {
    //                 return reject(error);
    //             });
    //     });
    // }

    // public verify(rootCAId: string = ''): Promise<boolean> {
    //     return new Promise((resolve, reject) => {
    //         this.verifyRecursively(this._data.delegator)
    //             .then((signatureIsValid: boolean) => {
    //                 // TODO:
    //                 // capabilities verification,
    //                 // check delegator against passed/default rootCA
    //                 // check delegate against targed(passed)
    //                 // recursive if parent is defined
    //                 return resolve(signatureIsValid);
    //             })
    //             .catch((error: any) => {
    //                 return reject(error);
    //             });
    //     });
    // }
}
