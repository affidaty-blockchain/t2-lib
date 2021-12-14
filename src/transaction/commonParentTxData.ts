import { objectToBytes, sha256 } from '../utils';
import { TTxSchemaType } from './txTypes';

export interface ICommonParentTxDataUnnamedObject extends Array<any> {
    [0]: TTxSchemaType;
}

export interface ICommonParentTxDataObjectWithBuffers extends Object {
    schema: TTxSchemaType;
}

export interface ICommonParentTxDataObject extends Object {
    schema: string;
}

export interface ICommonParentTxDataInternal extends Object{
    schema: TTxSchemaType;
    toUnnamedObject(): Promise<ICommonParentTxDataUnnamedObject>;
    toObjectWithBuffers(): Promise<ICommonParentTxDataObjectWithBuffers>;
    toObject(): Promise<ICommonParentTxDataObject>;
    fromUnnamedObject(unnamedObj: ICommonParentTxDataUnnamedObject): Promise<boolean>;
    fromObjectWithBuffers(objWithBuffers: ICommonParentTxDataObjectWithBuffers): Promise<boolean>;
    fromObject(obj: ICommonParentTxDataObject): Promise<boolean>;
    sha256(): Promise<Uint8Array>;
}

export class CommonParentTxData implements ICommonParentTxDataInternal {
    protected _schema: TTxSchemaType;
    
    constructor(schema: TTxSchemaType = '') {
        this.schema = schema;
    }

    public static getConstructor(): CommonParentTxData {
        return new this('');
    }

    public static defaultSchema(): TTxSchemaType {
        return '';
    }

    public get schema(): TTxSchemaType {
        return this.schema;
    }

    public set schema(schema: TTxSchemaType) {
        this._schema = schema;
    }

    public toUnnamedObject(): Promise<ICommonParentTxDataUnnamedObject> {
        return new Promise((resolve) => {
            return resolve([this.schema]);
        });
    }

    public toObjectWithBuffers(): Promise<ICommonParentTxDataObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ICommonParentTxDataUnnamedObject) => {
                    return resolve(
                        {
                            schema: unnamedObject[0],
                        }
                    );
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObject(): Promise<ICommonParentTxDataObject> {
        return new Promise((resolve, reject) => {
            this.toObjectWithBuffers()
                .then((objWithBuffers: ICommonParentTxDataObjectWithBuffers) => {
                    return resolve(objWithBuffers);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObject(unnamedObj: ICommonParentTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve) => {
            this.schema = unnamedObj[0];
            return resolve(true)
        });
    }

    public fromObjectWithBuffers(objWithBuffers: ICommonParentTxDataObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.fromUnnamedObject(
                [
                    objWithBuffers.schema
                ]
            )
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                })
            this.schema = objWithBuffers.schema;

        });
    }

    public fromObject(obj: ICommonParentTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.fromObjectWithBuffers(
                {
                    schema: obj.schema,
                }
            )
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public sha256(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
            .then((unnamedObject: ICommonParentTxDataUnnamedObject) => {
                return resolve(
                    sha256(
                        objectToBytes(unnamedObject),
                    )
                );
            })
            .catch((error: any) => {
                return reject(error);
            })
        });
    }
}

