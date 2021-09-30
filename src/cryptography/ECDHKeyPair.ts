import { ECDHP384R1KeyPairParams as defaultParams } from './cryptoDefaults';
import { BaseECKeyPair } from './baseECKeyPair';

/** A wrapper around BaseECKeyPair class which automatically uses default ECDH params */
export class ECDHKeyPair extends BaseECKeyPair {
    constructor() {
        super(defaultParams);
    }
}
