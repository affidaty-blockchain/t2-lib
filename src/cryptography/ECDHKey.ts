import * as Errors from '../errors';
import { Subtle } from './webCrypto';
import { IKeyParams } from './baseTypes';
import { BaseKey } from './base';
import { ECDHP384R1KeyPairParams as defaultParams } from './cryptoDefaults';
import { BaseECKey } from './baseECKey';

type TKeyType = 'public' | 'private';

/** A wrapper around BaseECKey class which automatically uses default ECDH params */
export class ECDHKey extends BaseECKey {
    constructor(keyType: TKeyType, keyParams?: IKeyParams) {
        super();
        switch (keyType) {
            case 'public':
                this.keyParams = typeof keyParams === 'undefined' ? defaultParams.publicKey : keyParams;
                this.type = 'public';
                break;
            default:
                this.keyParams = typeof keyParams === 'undefined' ? defaultParams.privateKey : keyParams;
                this.type = 'private';
                break;
        }
    }
}

/**
 * Derives a common secret key from a pair of ECDH keys
 * @param publicKey - other party's public ECDH key
 * @param privateKey - your own ECDH private key
 * @param derivedKeyParams - derivation algorithm (see defaultParams)
 * @returns - deriver BaseKey object
 */
export function deriveKeyFromECDH(
    publicKey: ECDHKey,
    privateKey: ECDHKey,
    derivedKeyParams: IKeyParams,
): Promise<BaseKey> {
    return new Promise((resolve, reject) => {
        if (publicKey.type !== 'public') {
            return reject(new Error(Errors.ECDH_DERIVE_NOT_PUB));
        }
        if (privateKey.type !== 'private') {
            return reject(new Error(Errors.ECDH_DERIVE_NOT_PRIV));
        }
        publicKey.getCryptoKey()
            .then((pubCryptoKey: CryptoKey) => {
                privateKey.getCryptoKey()
                    .then((privCryptoKey) => {
                        Subtle.deriveKey(
                            {
                                name: 'ECDH',
                                public: pubCryptoKey,
                            },
                            privCryptoKey,
                            derivedKeyParams.genAlgorithm,
                            true,
                            derivedKeyParams.usages,
                        )
                            .then((derivedCryptoKey: CryptoKey) => {
                                const derivedKey = new BaseKey(derivedKeyParams);
                                derivedKey.setCryptoKey(derivedCryptoKey);
                                return resolve(derivedKey);
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
