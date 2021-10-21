import { bytesToObject, objectToBytes } from './utils';
import { ITxUnnamedObject } from './transaction';

export namespace MessageTypes {
    export const Undefined = -1;
    export const Exception = 0;
    // export const Subscribe = 1;
    // export const Unsubscribe = 2;
    export const SubmitTransactionRequest = 3;
    export const SubmitTransactionResponse = 4;
    export const GetTransactionRequest = 5;
    export const GetTransactionResponse = 6;
    export const GetReceiptRequest = 7;
    export const GetReceiptResponse = 8;
    export const GetBlockRequest = 9;
    export const GetBlockResponse = 10;
    export const GetAccountRequest = 11;
    export const GetAccountResponse = 12;
    export const Stop = 254;
    export const Packed = 255;
}

export type TSubscribeEventType = 'Transaction' | 'Block';

interface IMessagesSettings {
    [key: number]: {
        name: string;
        bodyOrder: string[];
    };
}

const MsgStructs: IMessagesSettings = {
    [MessageTypes.Undefined]: { // ok
        name: 'Undefined',
        bodyOrder: [],
    },
    [MessageTypes.Exception]: { // ok
        name: 'Exception',
        bodyOrder: ['type', 'source'],
    },
    // [MessageTypes.Subscribe]: {
    //     name: 'Subscribe',
    //     bodyOrder: ['id', 'event', 'receivePacked'],
    // },
    // [MessageTypes.Unsubscribe]: {
    //     name: 'Unsubscribe',
    //     bodyOrder: ['id', 'event'],
    // },
    [MessageTypes.SubmitTransactionRequest]: { // ok
        name: 'SubmitTransaction request',
        bodyOrder: ['confirmed', 'tx'],
    },
    [MessageTypes.SubmitTransactionResponse]: { // ok
        name: 'SubmitTransaction response',
        bodyOrder: ['ticket'],
    },

    [MessageTypes.GetTransactionRequest]: { // ok
        name: 'GetTransactions request',
        bodyOrder: ['ticket'],
    },
    [MessageTypes.GetTransactionResponse]: { // ok
        name: 'GetTransaction response',
        bodyOrder: ['tx'],
    },
    [MessageTypes.GetReceiptRequest]: { // ok
        name: 'GetReceipt request',
        bodyOrder: ['ticket'],
    },
    [MessageTypes.GetReceiptResponse]: { // ok
        name: 'GetReceipt response',
        bodyOrder: ['receipt'],
    },
    [MessageTypes.GetBlockRequest]: { // ok
        name: 'GetBlock request',
        bodyOrder: ['height', 'showTickets'],
    },
    [MessageTypes.GetBlockResponse]: { // ok
        name: 'GetBlock response',
        bodyOrder: ['blockInfo', 'ticketList'],
    },

    [MessageTypes.GetAccountRequest]: {
        name: 'GetAccount request',
        bodyOrder: ['accountId', 'keys'],
    },
    [MessageTypes.GetAccountResponse]: {
        name: 'GetAccount response',
        bodyOrder: ['accountInfo', 'data'],
    },
    [MessageTypes.Stop]: {
        name: 'Stop',
        bodyOrder: [],
    },
    [MessageTypes.Packed]: {
        name: 'Packed',
        bodyOrder: ['packedMessages'],
    },
};

interface TMessageArray extends Array<any> {
    [0]: string;
    [key: number]: any;
}

interface IInternalBody {
    [key: string]: any;
}

/**
 * Trinci Message class for messagges import/export and transcoding.
 * Trinci nodes communicate using serialized messages.
 */
export class TrinciMessage {
    private msgTypeValue: number = MessageTypes.Undefined;

    private _body: IInternalBody = {};

    private bodyOrder: string[] = [];

    constructor(msgType: number = MessageTypes.Undefined, msgBody: IInternalBody = {}) {
        this.msgTypeValue = msgType;
        this.bodyOrder = MsgStructs[this.msgTypeValue].bodyOrder;
        this._body = msgBody;
    }

    get type(): number {
        return this.msgTypeValue;
    }

    get typeName(): string {
        return MsgStructs[this.msgTypeValue].name;
    }

    get body(): IInternalBody {
        return this._body;
    }

    assertType(expectedType: number): void {
        if (this.type === MessageTypes.Exception) {
            throw new Error(
                `Exception message received from blockchain. Type: ${this.body.type}; Source: ${this.body.source}`,
            );
        }
        if (this.type !== expectedType) {
            throw new Error(
                `Wrong message type received: ${this.type}; Expected: ${expectedType}`,
            );
        }
    }

    buildMessageArray(): TMessageArray {
        const messageArray: TMessageArray = [this.msgTypeValue.toString()];
        this.bodyOrder.forEach((bodyMemberKey) => {
            if (typeof this._body[bodyMemberKey] === 'undefined') {
                throw new Error(`Member '${bodyMemberKey}' undefined.`);
            }
            messageArray.push(this._body[bodyMemberKey]);
        });
        return messageArray;
    }

    public toBytes(): Uint8Array {
        if (this.msgTypeValue === MessageTypes.Undefined) {
            throw new Error('Cannot pack an undefined message');
        }
        const messageArray: TMessageArray = this.buildMessageArray();
        return objectToBytes(messageArray);
    }

    public fromBytes(messageBytes: Uint8Array): void {
        const messageArray: TMessageArray = bytesToObject(messageBytes);
        if (
            // TODO: change this as soon as core changes message type to number
            typeof messageArray[0] !== 'string'
            || typeof MsgStructs[parseInt(messageArray[0], 10)] === 'undefined'
        ) {
            throw new Error(`Unknown message type. Bytes received: ${Buffer.from(messageBytes).toString('hex')}`);
        }
        this.msgTypeValue = parseInt(messageArray[0], 10);
        this.bodyOrder = MsgStructs[this.msgTypeValue].bodyOrder;
        if (
            messageArray.length !== (MsgStructs[this.msgTypeValue].bodyOrder.length + 1)
        ) {
            throw new Error(`Unknown message type. Bytes received: ${Buffer.from(messageBytes).toString('hex')}`);
        }
        // starting from the second element as the first is the message type identifier
        for (let i = 1; i < messageArray.length; i += 1) {
            this._body[this.bodyOrder[i - 1]] = messageArray[i];
        }
    }
}

/** Standard Trinci messagges */
export namespace stdTrinciMessages {
    // export function subscribe(
    //     id: string,
    //     event: TSubscribeEventType,
    //     receivePacked: boolean,
    // ): TrinciMessage {
    //     return new TrinciMessage(MessageTypes.Subscribe, {
    //         id,
    //         event,
    //         receivePacked,
    //     });
    // }

    // export function unsubscribe(
    //     id: string,
    //     event: TSubscribeEventType,
    // ): TrinciMessage {
    //     return new TrinciMessage(MessageTypes.Subscribe, {
    //         id,
    //         event,
    //     });
    // }

    export function submitTransaction(
        confirmed: boolean,
        TxObj: ITxUnnamedObject,
    ): TrinciMessage {
        return new TrinciMessage(MessageTypes.SubmitTransactionRequest, {
            confirmed,
            tx: TxObj,
        });
    }

    export function getTransaction(
        ticket: string,
    ): TrinciMessage {
        const binTicket = Buffer.from(ticket, 'hex');
        return new TrinciMessage(MessageTypes.GetTransactionRequest, {
            ticket: binTicket,
        });
    }

    export function getReceipt(
        ticket: string,
    ): TrinciMessage {
        const binTicket = Buffer.from(ticket, 'hex');
        return new TrinciMessage(MessageTypes.GetReceiptRequest, {
            ticket: binTicket,
        });
    }

    export function getBlock(height: number, showTxs: boolean = true): TrinciMessage {
        return new TrinciMessage(MessageTypes.GetBlockRequest, {
            height,
            showTickets: showTxs,
        });
    }

    export function getAccount(accountId: string, keys: string[] = []): TrinciMessage {
        return new TrinciMessage(MessageTypes.GetAccountRequest, {
            accountId,
            keys,
        });
    }

    export function packed(messages: TrinciMessage[]): TrinciMessage {
        const messageList: TMessageArray[] = [];
        messages.forEach((message: TrinciMessage) => {
            messageList.push(message.buildMessageArray());
        });
        return new TrinciMessage(MessageTypes.Packed, {
            packedMessages: objectToBytes(messageList),
        });
    }

    export function stop(): TrinciMessage {
        return new TrinciMessage(MessageTypes.Stop);
    }
}
