import { Subtle } from './webCrypto';
import * as Errors from '../errors';
import { bufferToBase64url } from '../binConversions';
import { padStrWithZeroes } from '../utils';
import {
    IKeyPairParams,
} from './baseTypes';
import { ellipticCurves } from './cryptoDefaults';
import genSeededECKeys from './baseSeededECKeyGen';
import { IBaseKeyPair } from './base';
import { BaseECKey } from './baseECKey';

export interface IBaseECKeyPair extends IBaseKeyPair {
    keyPairParams: IKeyPairParams;
    publicKey: BaseECKey;
    privateKey: BaseECKey;
}

/**
 * Basic ellliptic curve key pair class
 */
export class BaseECKeyPair implements IBaseECKeyPair {
    public keyPairParams: IKeyPairParams;

    public publicKey: BaseECKey;

    public privateKey: BaseECKey;

    constructor(keyPairParams: IKeyPairParams) {
        this.keyPairParams = keyPairParams;
        this.publicKey = new BaseECKey(keyPairParams.publicKey);
        this.privateKey = new BaseECKey(keyPairParams.privateKey);
    }

    /**
     * Generates elliptic curve key pair with parameters given to the ctor
     */
    public generate(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            Subtle.generateKey(
                this.keyPairParams.privateKey.genAlgorithm,
                true,
                this.keyPairParams.usages,
            )
                /* eslint-disable-next-line no-undef */
                .then((cryptoKeyPair: CryptoKeyPair) => {
                    this.publicKey.setCryptoKey(cryptoKeyPair.publicKey!)
                        .then(() => {
                            this.privateKey.setCryptoKey(cryptoKeyPair.privateKey!)
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
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Generates elliptic curve key pair from a secret
     */
    public generateFromSecret(secret: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            Subtle.generateKey(
                this.keyPairParams.privateKey.genAlgorithm,
                true,
                this.keyPairParams.usages,
            )
                /* eslint-disable-next-line no-undef */
                .then((cryptoKeyPair: CryptoKeyPair) => {
                    this.privateKey.setCryptoKey(cryptoKeyPair.privateKey!)
                        .then(() => {
                            this.privateKey.getJWK()
                                .then((currPrivKeyJWK) => {
                                    const jwk = currPrivKeyJWK;
                                    if (
                                        typeof this.keyPairParams.privateKey.genAlgorithm!.namedCurve !== 'string'
                                        || typeof ellipticCurves[this.keyPairParams.privateKey.genAlgorithm!.namedCurve] === 'undefined'
                                    ) {
                                        return reject(new Error(Errors.NOT_VALID_CURVE_NAME));
                                    }
                                    const curveParams = ellipticCurves[
                                        this.keyPairParams.privateKey.genAlgorithm!.namedCurve
                                    ];
                                    const { x, y, d } = genSeededECKeys(curveParams, secret);
                                    jwk.x = bufferToBase64url(Buffer.from(padStrWithZeroes(x.toString(16), curveParams.keyLength / 4), 'hex'));
                                    jwk.y = bufferToBase64url(Buffer.from(padStrWithZeroes(y.toString(16), curveParams.keyLength / 4), 'hex'));
                                    jwk.d = bufferToBase64url(Buffer.from(padStrWithZeroes(d.toString(16), curveParams.keyLength / 4), 'hex'));
                                    this.privateKey.setJWK(jwk)
                                        .then((setJwkResult) => {
                                            if (!setJwkResult) {
                                                return reject(new Error('.setJWK() returned false'));
                                            }
                                            this.privateKey.extractPublic()
                                                .then((pubKey) => {
                                                    this.publicKey = pubKey;
                                                    return resolve(true);
                                                })
                                                .catch((error: any) => {
                                                    return reject(error);
                                                });
                                        })
                                        .catch((error: any) => {
                                            return reject(error);
                                        });
                                })
                                .catch((error: any) => {
                                    return reject(error);
                                });
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
}
