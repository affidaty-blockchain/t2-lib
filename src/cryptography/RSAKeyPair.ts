import { Subtle } from './webCrypto';
import { IKeyPairParams } from './baseTypes';
import { IBaseKeyPair } from './base';
import { RSAOAEP384KeyPairParams as defaultParams } from './cryptoDefaults';
import { RSAKey } from './RSAKey';

export interface IRSAKeyPair extends IBaseKeyPair {
    keyPairParams: IKeyPairParams;
    publicKey: RSAKey;
    privateKey: RSAKey;
}

/**
 * RSA key pair class
 */
export class RSAKeyPair implements IRSAKeyPair {
    public keyPairParams: IKeyPairParams;

    public publicKey: RSAKey;

    public privateKey: RSAKey;

    constructor(keyPairParams: IKeyPairParams = defaultParams) {
        this.keyPairParams = keyPairParams;
        this.publicKey = new RSAKey('public', this.keyPairParams.publicKey);
        this.privateKey = new RSAKey('private', this.keyPairParams.privateKey);
    }

    /**
     * Generates rsa key pair with parameters given to the ctor
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
}
