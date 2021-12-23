import { Subtle } from './webCrypto';
import {
    IKeyPairParams,
} from './baseTypes';
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
     * Generates elliptic curve key pair with parameters givven to the ctor
     */
    public generate(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            Subtle.generateKey(
                this.keyPairParams.privateKey.genAlgorithm,
                true,
                this.keyPairParams.usages,
            )
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
}
