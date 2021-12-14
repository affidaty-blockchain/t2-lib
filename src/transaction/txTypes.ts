export type TTxSchemaType = string;

export namespace TxTypes {
    export const ATOMIC_TX: TTxSchemaType = 'atomicTxSchema';
    export const BULK_TX: TTxSchemaType = 'bulkTxSchema';
    export const BULK_ROOT_TX: TTxSchemaType = 'bulkRootTxSchema';
    export const BULK_NODE_TX: TTxSchemaType = 'bulkNodeTxSchema';
}