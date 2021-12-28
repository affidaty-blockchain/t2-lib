import * as Errors from '../errors';
import { BaseECKey } from '../cryptography/baseECKey';
import {
    TTxSchemaType,
    TxSchemas,
    CommonParentTxData,
    ICommonParentTxDataUnnamedObject,
    ICommonParentTxDataObjectWithBuffers,
    ICommonParentTxDataObject,
} from './commonParentTxData';
import {
    BulkRootTransaction,
    IBulkRootTxObjectWithBuffers,
    IBulkRootTxObject,
    IBulkRootTxUnnamedObjectNoTag,
} from './bulkRootTransaction';
import {
    BulkNodeTransaction,
    IBulkNodeTxObjectWithBuffers,
    IBulkNodeTxObject,
    IBulkNodeTxUnnamedObjectNoTag,
} from './bulkNodeTransaction';

const DEFAULT_SCHEMA = TxSchemas.BULK_TX;

interface ITxListUnnamedObject extends Array<any> {
    [0]: IBulkRootTxUnnamedObjectNoTag;
    [key: number]: IBulkRootTxUnnamedObjectNoTag | IBulkNodeTxUnnamedObjectNoTag;
}

export interface IBulkTxDataUnnamedObject extends ICommonParentTxDataUnnamedObject {
    [1]: ITxListUnnamedObject;
}

interface ITxListObjectWithBuffers extends Array<any> {
    [0]: IBulkRootTxObjectWithBuffers;
    [key: number]: IBulkRootTxObjectWithBuffers | IBulkNodeTxObjectWithBuffers;
}

export interface IBulkTxDataObjectWithBuffers extends ICommonParentTxDataObjectWithBuffers {
    txs: ITxListObjectWithBuffers;
}

interface ITxListObject extends Array<any> {
    [0]: IBulkRootTxObject;
    [key: number]: IBulkRootTxObject | IBulkNodeTxObject;
}

export interface IBulkTxDataObject extends ICommonParentTxDataObject {
    txs: ITxListObject;
}

export class BulkTxData extends CommonParentTxData {
    protected _root: BulkRootTransaction;

    protected _nodes: Array<BulkNodeTransaction>;

    public static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    constructor(schema: TTxSchemaType = DEFAULT_SCHEMA) {
        super(schema);
        this._root = new BulkRootTransaction();
        this._nodes = [];
    }

    public set root(root: BulkRootTransaction) {
        this._root = root;
    }

    public get root(): BulkRootTransaction {
        return this._root;
    }

    public set nodes(nodes: Array<BulkNodeTransaction>) {
        this._nodes = nodes;
    }

    public get nodes(): Array<BulkNodeTransaction> {
        return this._nodes;
    }

    /** Signer's public key. */
    public set signerPublicKey(publicKey: BaseECKey) {
        this._root.data.signerPublicKey = publicKey;
    }

    /** Signer's public key. */
    public get signerPublicKey(): BaseECKey {
        return this._root.data.signerPublicKey;
    }

    public toUnnamedObject(): Promise<IBulkTxDataUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._root.toUnnamedObjectNoTag()
                .then((serializedRoot: IBulkRootTxUnnamedObjectNoTag) => {
                    const nodesPromises: Array<Promise<IBulkNodeTxUnnamedObjectNoTag>> = [];
                    for (let i = 0; i < this._nodes.length; i += 1) {
                        nodesPromises.push(this._nodes[i].toUnnamedObjectNoTag());
                    }
                    Promise.allSettled(nodesPromises)
                        .then((nodesResults) => {
                            const txList: ITxListUnnamedObject = [
                                serializedRoot,
                            ];
                            const resultObj: IBulkTxDataUnnamedObject = [
                                this._schema,
                                txList,
                            ];
                            for (let i = 0; i < nodesResults.length; i += 1) {
                                if (nodesResults[i].status === 'fulfilled') {
                                    resultObj[1].push(
                                        (
                                            nodesResults[i] as
                                            PromiseFulfilledResult<IBulkNodeTxUnnamedObjectNoTag>
                                        ).value,
                                    );
                                } else {
                                    return reject(
                                        new Error(
                                            `Could not export node transaction with index ${i}`,
                                        ),
                                    );
                                }
                            }
                            return resolve(resultObj);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(new Error(`could not export root: ${error}`));
                });
        });
    }

    public toObjectWithBuffers(): Promise<IBulkTxDataObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this._root.toObjectWithBuffers()
                .then((serializedRoot: IBulkRootTxObjectWithBuffers) => {
                    const nodesPromises: Array<Promise<IBulkNodeTxObjectWithBuffers>> = [];
                    for (let i = 0; i < this._nodes.length; i += 1) {
                        nodesPromises.push(this._nodes[i].toObjectWithBuffers());
                    }
                    Promise.allSettled(nodesPromises)
                        .then((nodesResults) => {
                            const txList: ITxListObjectWithBuffers = [
                                serializedRoot,
                            ];
                            const resultObj: IBulkTxDataObjectWithBuffers = {
                                schema: this._schema,
                                txs: txList,
                            };
                            for (let i = 0; i < nodesResults.length; i += 1) {
                                if (nodesResults[i].status === 'fulfilled') {
                                    resultObj.txs.push(
                                        (
                                            nodesResults[i] as
                                            PromiseFulfilledResult<IBulkNodeTxObjectWithBuffers>
                                        ).value,
                                    );
                                } else {
                                    return reject(
                                        new Error(
                                            `Could not export node transaction with index ${i}`,
                                        ),
                                    );
                                }
                            }
                            return resolve(resultObj);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(new Error(`could not export root: ${error}`));
                });
        });
    }

    public toObject(): Promise<IBulkTxDataObject> {
        return new Promise((resolve, reject) => {
            this._root.toObject()
                .then((serializedRoot: IBulkRootTxObject) => {
                    const nodesPromises: Array<Promise<IBulkNodeTxObject>> = [];
                    for (let i = 0; i < this._nodes.length; i += 1) {
                        nodesPromises.push(this._nodes[i].toObject());
                    }
                    Promise.allSettled(nodesPromises)
                        .then((nodesResults) => {
                            const txList: ITxListObject = [
                                serializedRoot,
                            ];
                            const resultObj: IBulkTxDataObject = {
                                schema: this._schema,
                                txs: txList,
                            };
                            for (let i = 0; i < nodesResults.length; i += 1) {
                                if (nodesResults[i].status === 'fulfilled') {
                                    resultObj.txs.push(
                                        (
                                            nodesResults[i] as
                                            PromiseFulfilledResult<IBulkNodeTxObject>
                                        ).value,
                                    );
                                } else {
                                    return reject(
                                        new Error(
                                            `Could not export node transaction with index ${i}`,
                                        ),
                                    );
                                }
                            }
                            return resolve(resultObj);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(new Error(`could not export root: ${error}`));
                });
        });
    }

    public fromUnnamedObject(passedObj: IBulkTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[0] !== DEFAULT_SCHEMA) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._root = new BulkRootTransaction();
            this._nodes = [];
            this._schema = passedObj[0];
            this._root.fromUnnamedObjectNoTag(passedObj[1][0])
                .then((result) => {
                    if (result) {
                        const nodesPromises: Array<Promise<boolean>> = [];
                        for (let i = 1; i < passedObj[1].length; i += 1) {
                            const bulkNodeTx = new BulkNodeTransaction();
                            this._nodes.push(bulkNodeTx);
                            nodesPromises.push(
                                this._nodes[i - 1].fromUnnamedObjectNoTag(
                                    passedObj[1][i] as IBulkNodeTxUnnamedObjectNoTag,
                                ),
                            );
                        }
                        Promise.allSettled(nodesPromises)
                            .then((nodesResults) => {
                                for (let i = 0; i < nodesResults.length; i += 1) {
                                    if (
                                        nodesResults[i].status === 'rejected'
                                        || !(
                                            nodesResults[i] as PromiseFulfilledResult<boolean>
                                        ).value
                                    ) {
                                        return reject(
                                            new Error(
                                                `Could not import transaction with index ${i + 1}`,
                                            ),
                                        );
                                    }
                                }
                                return resolve(true);
                            })
                            .catch((error: any) => {
                                return reject(error);
                            });
                    } else {
                        return reject(new Error('could not import root'));
                    }
                })
                .catch((error: any) => {
                    return reject(new Error(`could not import root: ${error}`));
                });
        });
    }

    public fromObjectWithBuffers(passedObj: IBulkTxDataObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj.schema !== DEFAULT_SCHEMA) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._schema = passedObj.schema;
            this._root.fromObjectWithBuffers(passedObj.txs[0])
                .then((result) => {
                    if (result) {
                        const nodesPromises: Array<Promise<boolean>> = [];
                        for (let i = 1; i < passedObj.txs.length; i += 1) {
                            const bulkNodeTx = new BulkNodeTransaction();
                            this._nodes.push(bulkNodeTx);
                            nodesPromises.push(
                                this._nodes[i - 1].fromObjectWithBuffers(
                                    passedObj.txs[i] as IBulkNodeTxObjectWithBuffers,
                                ),
                            );
                        }
                        Promise.allSettled(nodesPromises)
                            .then((nodesResults) => {
                                for (let i = 0; i < nodesResults.length; i += 1) {
                                    if (
                                        nodesResults[i].status === 'rejected'
                                        || !(
                                            nodesResults[i] as PromiseFulfilledResult<boolean>
                                        ).value
                                    ) {
                                        return reject(
                                            new Error(
                                                `Could not import transaction with index ${i + 1}`,
                                            ),
                                        );
                                    }
                                }
                                return resolve(true);
                            })
                            .catch((error: any) => {
                                return reject(error);
                            });
                    } else {
                        return reject(new Error('could not import root'));
                    }
                })
                .catch((error: any) => {
                    return reject(new Error(`could not import root: ${error}`));
                });
        });
    }

    public fromObject(passedObj: IBulkTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj.schema !== DEFAULT_SCHEMA) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._schema = passedObj.schema;
            this._root.fromObject(passedObj.txs[0])
                .then((result) => {
                    if (result) {
                        this._nodes = [];
                        const nodesPromises: Array<Promise<boolean>> = [];
                        for (let i = 1; i < passedObj.txs.length; i += 1) {
                            const bulkNodeTx = new BulkNodeTransaction();
                            this._nodes.push(bulkNodeTx);
                            nodesPromises.push(
                                this._nodes[i - 1].fromObject(
                                    passedObj.txs[i] as IBulkNodeTxObject,
                                ),
                            );
                        }
                        Promise.allSettled(nodesPromises)
                            .then((nodesResults) => {
                                for (let i = 0; i < nodesResults.length; i += 1) {
                                    if (
                                        nodesResults[i].status === 'rejected'
                                        || !(
                                            nodesResults[i] as PromiseFulfilledResult<boolean>
                                        ).value
                                    ) {
                                        return reject(
                                            new Error(
                                                `Could not import transaction with index ${i + 1}`,
                                            ),
                                        );
                                    }
                                }
                                return resolve(true);
                            })
                            .catch((error: any) => {
                                return reject(error);
                            });
                    } else {
                        return reject(new Error('could not import root'));
                    }
                })
                .catch((error: any) => {
                    return reject(new Error(`could not import root: ${error}`));
                });
        });
    }
}
