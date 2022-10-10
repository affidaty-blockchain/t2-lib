import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import {
    TTxSchemaType,
    TxSchemas,
    SignableTypeTags,
} from './commonParentTxData';
import { BaseTxData } from './baseTxData';
import { BulkRootTxData } from './bulkRootTxData';
import { BulkNodeTxData } from './bulkNodeTxData';
import { BulkTxData } from './bulkTxData';
import { TSchemaToDataMap, BaseTransaction } from './baseTransaction';
import { UnitaryTransaction } from './unitaryTransaction';
import { BulkTransaction } from './bulkTransaction';
import { BulkRootTransaction } from './bulkRootTransaction';
import { BulkNodeTransaction } from './bulkNodeTransaction';

const SCHEMA_TO_DATA_CLASS_MAP: TSchemaToDataMap = new Map();
SCHEMA_TO_DATA_CLASS_MAP.set(BaseTxData.defaultSchema, () => {
    return new BaseTxData(BaseTxData.defaultSchema);
});
SCHEMA_TO_DATA_CLASS_MAP.set(TxSchemas.BULK_ROOT_TX, () => {
    return new BulkRootTxData(TxSchemas.BULK_ROOT_TX);
});
SCHEMA_TO_DATA_CLASS_MAP.set(TxSchemas.BULK_EMPTY_ROOT_TX, () => {
    return new BulkRootTxData(TxSchemas.BULK_EMPTY_ROOT_TX);
});
SCHEMA_TO_DATA_CLASS_MAP.set(BulkNodeTxData.defaultSchema, () => {
    return new BulkNodeTxData(BulkNodeTxData.defaultSchema);
});
SCHEMA_TO_DATA_CLASS_MAP.set(BulkTxData.defaultSchema, () => {
    return new BulkTxData(BulkTxData.defaultSchema);
});

// eslint-disable-next-line max-len
export type TTypeTagToTxClassMap = Map<string, (hash?: TKeyGenAlgorithmValidHashValues)=>BaseTransaction>;
const TYPE_TAG_TO_TX_CLASS_MAP: TTypeTagToTxClassMap = new Map();
TYPE_TAG_TO_TX_CLASS_MAP.set(SignableTypeTags.UNITARY_TX, (hash?) => {
    return new UnitaryTransaction(hash);
});
TYPE_TAG_TO_TX_CLASS_MAP.set(SignableTypeTags.BULK_TX, (hash?) => {
    return new BulkTransaction(hash);
});
TYPE_TAG_TO_TX_CLASS_MAP.set(SignableTypeTags.BULK_EMPTY_ROOT_TX, (hash?) => {
    return new BulkRootTransaction(hash);
});
TYPE_TAG_TO_TX_CLASS_MAP.set(SignableTypeTags.BULK_ROOT_TX, (hash?) => {
    return new BulkRootTransaction(hash);
});
TYPE_TAG_TO_TX_CLASS_MAP.set(SignableTypeTags.BULK_NODE_TX, (hash?) => {
    return new BulkNodeTransaction(hash);
});

// eslint-disable-next-line max-len
function typeTagToClass(typeTag: string, hash?: TKeyGenAlgorithmValidHashValues): BaseTransaction {
    if (!TYPE_TAG_TO_TX_CLASS_MAP.has(typeTag)) {
        // unsure about transaction type. Use base transaction class.
        throw new Error('Unknown type tag');
    }
    return TYPE_TAG_TO_TX_CLASS_MAP.get(typeTag)!(hash);
}

export class Transaction extends BaseTransaction {
    constructor(
        schema: TTxSchemaType = BaseTxData.defaultSchema,
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        this.schemaClassMap = SCHEMA_TO_DATA_CLASS_MAP;
        if (this.schemaClassMap.has(schema)) {
            this._data = this.schemaClassMap.get(schema)!();
        } else {
            throw new Error(Errors.INVALID_SCHEMA);
        }
        this._typeTag = this._data.typeTag;
    }

    verify(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.toBytes()
                .then((thisTxBytes) => {
                    const tmpTxObj = typeTagToClass(this._typeTag);
                    tmpTxObj.fromBytes(thisTxBytes)
                        .then(() => {
                            tmpTxObj.verify()
                                .then((result) => {
                                    return resolve(result);
                                })
                                .catch((error) => {
                                    return reject(error);
                                });
                        })
                        .catch((error) => {
                            return reject(error);
                        });
                })
                .catch((error) => {
                    return reject(error);
                });
        });
    }
}
