import { Int64BE, Uint64BE } from 'int64-buffer';

import {
    base58ToBuffer,
    base64ToBuffer,
} from './binConversions';

const regexDigits = /^[0-9]*$/g;
const regexHex = /^[0-9A-Fa-f]*$/g;
const regexBase58 = /^[1-9A-HJ-NP-Za-km-z]*$/g;
const regexBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/g;

export const jsonParsers: {[key: string]: {[key: string]: (value: string) => any}} = {
    bin: {
        utf8: (val: string) => {
            return Buffer.from(val, 'utf8');
        },
        hex: (val: string) => {
            if (!val.match(regexHex)) {
                throw new Error('Value is not a hexadecimal string.');
            }
            const tempVal = val.length % 2 ? `0${val}` : val;
            return Buffer.from(tempVal, 'hex');
        },
        b58: (val: string) => {
            if (!val.match(regexBase58)) {
                throw new Error('Value is not a base58 string.');
            }
            return base58ToBuffer(val);
        },
        b64: (val: string) => {
            if (!val.match(regexBase64)) {
                throw new Error('Value is not a base64 string.');
            }
            return base64ToBuffer(val);
        },
    },
    i64: {
        dec: (val: string) => {
            if (!val.match(regexDigits)) {
                throw new Error('Value is not a decimal string.');
            }
            return new Int64BE(val, 10);
        },
        hex: (val: string) => {
            if (!val.match(regexHex)) {
                throw new Error('Value is not a hexadecimal string.');
            }
            const tempVal = val.length % 2 ? `0${val}` : val;
            if (tempVal.length > 16) {
                throw new Error('Hexadecimal strings for 64-bit numbers must be at most 16 chars long.');
            }
            return new Int64BE(tempVal, 16);
        },
    },
    u64: {
        dec: (val: string) => {
            if (!val.match(regexDigits)) {
                throw new Error('Value is not a decimal string.');
            }
            return new Uint64BE(val, 10);
        },
        hex: (val: string) => {
            if (!val.match(regexHex)) {
                throw new Error('Value is not a hexadecimal string.');
            }
            const tempVal = val.length % 2 ? `0${val}` : val;
            if (tempVal.length > 16) {
                throw new Error('Hexadecimal strings for 64-bit numbers must be at most 16 chars long.');
            }
            return new Uint64BE(tempVal, 16);
        },
    },
};

function callParser(type: string, encoding: string, value: string): any {
    if (!jsonParsers[type]) {
        throw new Error(`Known types: ${JSON.stringify(Object.keys(jsonParsers))}. Received type: "${type}".`);
    }
    if (!jsonParsers[type][encoding]) {
        throw new Error(`Known encodings for type "${type}": ${JSON.stringify(Object.keys(jsonParsers[type]))}. Received encoding: "${encoding}".`);
    }

    return jsonParsers[type][encoding](value);
}

export function parseArgs(jsonStr: string): any {
    const delimiter = ':';
    // special strings must begin with this token
    const initToken = `$${delimiter}`; // "$:"
    return JSON.parse(
        jsonStr,
        (key, value) => {
            if (
                typeof value === 'string'
                && value.length > initToken.length
                && value.startsWith(initToken)
            ) {
                // type delimiter index
                const typeDelIdx = value.indexOf(delimiter, initToken.length);
                if (typeDelIdx <= initToken.length) {
                    throw new Error(`Could not determine special value type for key ${key}.`);
                }
                // encoding delimiter index
                const encDelIdx = value.indexOf(delimiter, typeDelIdx + 1);
                if (encDelIdx <= typeDelIdx + 1 || encDelIdx + 1 >= value.length) {
                    throw new Error(`Could not determine special value encoding for key ${key}.`);
                }
                const type = value.substring(initToken.length, typeDelIdx);
                const enc = value.substring(typeDelIdx + 1, encDelIdx);
                const val = value.substring(encDelIdx + 1);

                return callParser(type, enc, val);
            }
            return value;
        },
    );
}
