export const KEY_PARAMS_NOT_SET = 'You must set key params first';
export const KEY_PARAMS_REDEFINITION = 'Key parameters cannot be redefined.';
export const NO_PREDEF_KEY_PARAMS_ID = 'No predefined params for given paramsId.';
export const UNDEF_KEY_GEN_ALGORITHM = 'Key generation algorithm not defined.';
export const UNDEF_KEY_USAGES = 'Key usages not defined.';
export const NOT_SECURE_CONTEXT = 'T2Lib cannot be used outside a secure context.';
export const UNDEF_SETTER_ARG = 'Undefined setter argument.';
export const NO_BASE_KEY_VALUE = 'No value has been set for this key.';
export const UNDEF_KEY_IMPORT_ALGORITHM = 'Key import algorithm not defined.';
export const UNDEF_EXPORTED_KEY = 'Exported key not defined.';
export const NOT_PUBLIC_EC_BYTES = 'Given bytes must encode a public EC key.';
export const NOT_PRIVATE_EC_BYTES = 'Given bytes must encode a private EC key.';
export const ONLY_FOR_PUBKEY = 'Function available only for public keys.';
export const ONLY_FOR_PRIVKEY = 'Function available only for private keys.';
export const NOT_EC_KEY = 'Not an EC key.';
export const IMPORT_ALG_ERROR = 'Wrong algorithm.';
export const IMPORT_USAGES_ERROR = 'Incompatible key usages.';
export const IMPORT_TYPE_ERROR = 'Incompatible key type.';
export const EMPTY_VALUE = 'Value cannot be empty.';
export const NOT_UINT8ARRAY = 'Not a Uint8Array.';
export const WRONG_TX_NONCE_LENGTH = 'Transaction nonce should be 8 bytes long';
export const WRONG_TX_NETWORK = 'Wrong transaction network';
export const NOT_RSA_KEY = 'Not an RSA key.';
export const ECDH_DERIVE_NOT_PUB = 'Passed ECDH key is not a public key';
export const ECDH_DERIVE_NOT_PRIV = 'Passed ECDH key is not a private key';
export const IV_LEN = 'Wrong initialization vector byte length.';
export const SALT_LEN = 'Wrong salt byte length.';
export const DATA_LEN = 'Wrong data byte length.';
export const MERK_WRONG_IDXS = 'Wrong value(s) in indexes array.';
export const CERT_WRONG_FIELDS = 'Wrong field(s).';
export const CERT_CANNOT_VERIFY = 'Cannot verify data. Multiproof missig';
export const CERT_NO_DATA_VERIFY = 'No data provided.';
export const REQUEST_UNSUPPORTED_METHOD = 'Unsupported request method.';
export const KEY_IMPORT_CLASS_NOT_INIT = 'Key class object must be initialized first.';
export const KEY_IMPORT_UNKNOWN_FORMAT = 'Could not determine the key format.';
export const INVALID_SCHEMA = 'Invalid transaction schema.';
export const BULK_ROOT_TX_NO_SIGN = 'Cannot sign bulk root transaction directly. Sign the whole bulk instead.';
export const BULK_ROOT_TX_NO_VERIFY = 'Cannot verify bulk root transaction directly. Verify the whole bulk instead.';
export const FUEL_NEGATIVE = 'Fuel amount cannot be negative.';
export const INVALID_PORT = 'Invalid port number.';
export const INVALID_HOSTNAME = 'Invalid hostname.';
export const UNKNOWN_TX = 'Unknown transaction.';
export const NOT_SUB_TO_BLOCKS = 'Not subscribed to blocks.';
export const NO_BRIDGE_IN_BROWSER = 'Bridge is not available in browser context.';
