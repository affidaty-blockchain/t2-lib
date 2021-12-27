import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import { TTxSchemaType, TxSchemas } from './commonParentTxData';
import { BaseTxData } from './baseTxData';
import { BulkNodeTxData } from './bulkNodeTxData';
import { BulkTxData } from './bulkTxData';
import { TSchemaToDataMap, BaseTransaction } from './baseTransaction';

const SCHEMA_TO_CLASS_MAP: TSchemaToDataMap = new Map();
SCHEMA_TO_CLASS_MAP.set(
    BaseTxData.defaultSchema, () => {
        return new BaseTxData(BaseTxData.defaultSchema);
    },
);
SCHEMA_TO_CLASS_MAP.set(
    TxSchemas.BULK_ROOT_TX, () => {
        return new BaseTxData(TxSchemas.BULK_ROOT_TX);
    },
);
SCHEMA_TO_CLASS_MAP.set(
    BulkNodeTxData.defaultSchema, () => {
        return new BulkNodeTxData(BulkNodeTxData.defaultSchema);
    },
);

SCHEMA_TO_CLASS_MAP.set(
    BulkTxData.defaultSchema, () => {
        return new BulkTxData(BulkTxData.defaultSchema);
    },
);

export class Transaction extends BaseTransaction {
    constructor(
        schema: TTxSchemaType = BaseTxData.defaultSchema,
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        this.schemaClassMap = SCHEMA_TO_CLASS_MAP;
        if (this.schemaClassMap.has(schema)) {
            this._data = this.schemaClassMap.get(schema)!();
        } else {
            throw new Error(Errors.INVALID_SCHEMA);
        }
        this._typeTag = this._data.typeTag;
    }
}
