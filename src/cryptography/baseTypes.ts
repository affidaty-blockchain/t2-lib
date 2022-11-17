export type TValidKeyType = 'public' | 'private' | 'secret' |'undefined';
export type TValidKeyFormatValues = 'jwk' | 'raw';
export type TValidKeyUsageValues = 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'deriveKey' | 'deriveBits' | 'wrapKey' | 'unwrapKey';
export type TKeyUsages = TValidKeyUsageValues[];
export type TTranscryptAlgorithmValidName = 'RSA-OAEP' | 'AES-GCM';
export type TKeyGenAlgorithmValidNameValues = '' | 'ECDSA' | 'ECDH' | 'RSA-OAEP' | 'AES-GCM' | 'HMAC' | 'PBKDF2';
export type TKeyGenAlgorithmValidNamedCurveValues = 'P-384' | 'P-256';
export type TKeyGenAlgorithmValidModulusLengthValues = 2048 | 3072 | 4096;
export type TKeyGenAlgorithmValidPublicExponentValues = Uint8Array;
export type TKeyGenAlgorithmValidHashValues = 'SHA-256' | 'SHA-384' | 'SHA-512';
export type TValidSymmetricKeyLength = 256;

interface IRsaOtherPrimesInfo {
    d?: string;
    r?: string;
    t?: string;
}

/** JWK Interface */
export interface IJwk {
    /* eslint-disable-next-line camelcase */
    key_ops?: TKeyUsages,
    ext?: boolean;
    kty: string;
    crv?: string;
    alg?: string;
    d?: string;
    x?: string;
    y?: string;
    k?: string;
    dp?: string;
    dq?: string;
    e?: string;
    n?: string;
    oth?: IRsaOtherPrimesInfo[];
    p?: string;
    q?: string;
    qi?: string;
    use?: string;
}

/**
* Interface to define key generation algorithm params.
* Used in IKeyParams interface and for key derivation.
*/
export interface IKeyGenAlgorithm {
    name: TKeyGenAlgorithmValidNameValues, // all
    namedCurve?: TKeyGenAlgorithmValidNamedCurveValues, // EC
    modulusLength?: TKeyGenAlgorithmValidModulusLengthValues, // RSA
    publicExponent?: TKeyGenAlgorithmValidPublicExponentValues, // RSA
    hash?: TKeyGenAlgorithmValidHashValues, // RSA, HMAC
    length?: TValidSymmetricKeyLength, // AES
}

/**
* Interface that defines cryptographic key params.
*/
export interface IKeyParams {
    /** String identifying this particulas set of parameters */
    paramsId: string;
    genAlgorithm?: IKeyGenAlgorithm;
    /** array of key usages */
    usages?: TKeyUsages;
    type: TValidKeyType;
}

/** Interface defining parameters for a keypair generation */
export interface IKeyPairParams {
    publicKey: IKeyParams;
    privateKey: IKeyParams;
    /** Union of publicKey and privateKey usages */
    usages: TKeyUsages;
}

export interface ITranscryptParams {
    name: TTranscryptAlgorithmValidName;
    iv?: Uint8Array;
}

export interface IEllipticCurveParams {
    /** length in bits of the key */
    keyLength: number
    /** prime */
    p: bigint,
    /** equation parameter */
    a: bigint,
    /** equation parameter */
    b: bigint,
    /** generator point */
    g: {
        x: bigint,
        y: bigint,
    },
    /** order */
    n: bigint,
}
