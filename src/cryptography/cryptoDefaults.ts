import { arrayUnion } from '../utils';
import {
    IKeyParams,
    IKeyPairParams,
    TKeyUsages,
    TKeyGenAlgorithmValidHashValues,
} from './base';

export const DEF_AES_IV_BYTE_LEN: number = 12;

export const DEF_AES_SALT_BYTE_LEN: number = 16;

export const DEF_SIGN_HASH_ALGORITHM: TKeyGenAlgorithmValidHashValues = 'SHA-384';

/** List of default params Ids */
export const EKeyParamsIds = {
    AESGCM256: 'aesgcm_256',
    HMACSHA384: 'hmac_sha384',
    ECDSAP384R1: 'ecdsa_secp384r1',
    ECDHP384R1: 'ecdh_secp384r1',
    RSAOAEP384: 'rsa_oaep_384',
    EMPTY: '',
};

/** Params set for an empty key */
export const EmptyKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.EMPTY,
    genAlgorithm: {
        name: '',
    },
    usages: [],
    type: 'undefined',
};

/** Params set for an empty key pair */
export const EmptyKeyPairParams: IKeyPairParams = {
    publicKey: EmptyKeyParams,
    privateKey: EmptyKeyParams,
    usages: [],
};

/** Params set for ECDSA P-384 public key */
export const ECDSAP384R1PubKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'ECDSA',
        namedCurve: 'P-384',
    },
    usages: ['verify'],
    type: 'public',
};

/** Params set for ECDSA P-384 private key */
export const ECDSAP384R1PrivKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'ECDSA',
        namedCurve: 'P-384',
    },
    usages: ['sign'],
    type: 'private',
};

/** Params set for ECDSA P-384 key pair */
export const ECDSAP384R1KeyPairParams: IKeyPairParams = {
    publicKey: ECDSAP384R1PubKeyParams,
    privateKey: ECDSAP384R1PrivKeyParams,
    get usages(): TKeyUsages {
        return arrayUnion([this.publicKey.usages!, this.privateKey.usages!]);
    },
};

/** Params set for ECDH P-384 public key */
export const ECDHP384R1PubKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'ECDH',
        namedCurve: 'P-384',
    },
    usages: [],
    type: 'public',
};

/** Params set for ECDh P-384 private key */
export const ECDHP384R1PrivKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'ECDH',
        namedCurve: 'P-384',
    },
    usages: ['deriveKey', 'deriveBits'],
    type: 'private',
};

/** Params set for ECDH P-384 key pair */
export const ECDHP384R1KeyPairParams: IKeyPairParams = {
    publicKey: ECDHP384R1PubKeyParams,
    privateKey: ECDHP384R1PrivKeyParams,
    get usages(): TKeyUsages {
        return arrayUnion([this.publicKey.usages!, this.privateKey.usages!]);
    },
};

/** Params set for RSA-OAEP public key */
export const RSAOAEP384PubKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: 'SHA-384',
    },
    usages: ['encrypt', 'wrapKey'],
    type: 'public',
};

/** Params set for RSA-OAEP private key */
export const RSAOAEP384PrivKeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.ECDSAP384R1,
    genAlgorithm: {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: 'SHA-384',
    },
    usages: ['decrypt', 'unwrapKey'],
    type: 'private',
};

/** Params set for RSA-OAEP key pair */
export const RSAOAEP384KeyPairParams: IKeyPairParams = {
    publicKey: RSAOAEP384PubKeyParams,
    privateKey: RSAOAEP384PrivKeyParams,
    get usages(): TKeyUsages {
        return arrayUnion([this.publicKey.usages!, this.privateKey.usages!]);
    },
};

/** Params set for AES-GCM 256-bit long symmetric key */
export const AESGCM256KeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.AESGCM256,
    genAlgorithm: {
        name: 'AES-GCM',
        length: 256,
    },
    usages: ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
    type: 'secret',
};

/** Params set for HMAC symmetric key using SHA-384 hash algorithm */
export const HMACSHA384KeyParams: IKeyParams = {
    paramsId: EKeyParamsIds.HMACSHA384,
    genAlgorithm: {
        name: 'HMAC',
        hash: 'SHA-384',
    },
    usages: ['sign', 'verify'],
    type: 'secret',
};

/** Mapping of params Ids with actual parameters */
export const mKeyPairParams: ReadonlyMap<string, IKeyPairParams> = new Map([
    [EKeyParamsIds.EMPTY, EmptyKeyPairParams],
    [EKeyParamsIds.ECDSAP384R1, ECDSAP384R1KeyPairParams],
    [EKeyParamsIds.ECDHP384R1, ECDHP384R1KeyPairParams],
    [EKeyParamsIds.RSAOAEP384, RSAOAEP384KeyPairParams],
]);
