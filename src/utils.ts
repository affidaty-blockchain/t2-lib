import { encode as mpEncode, decode as mpDecode } from 'msgpack-lite';
import { bufferToArrayBuffer } from './binConversions';
import {
    DEF_AES_IV_BYTE_LEN as defIVLength,
    DEF_AES_SALT_BYTE_LEN as defSaltLength,
} from './cryptography/cryptoDefaults';

/**
 * Produces a union of given arrays.
 * @param array - an array of arrays of the same type
 * @returns - An array composed from all the elements
 * of passed arrays, but without duplicates.
 */
export function arrayUnion<T>(array: Array<Array<T>>): Array<T> {
    const result: Array<T> = [];
    for (let i = 0; i < array.length; i += 1) {
        for (let j = 0; j < array[i].length; j += 1) {
            if (result.indexOf(array[i][j]) === -1) {
                result.push(array[i][j]);
            }
        }
    }
    return result;
}

/** Checks if two gived arrays are similar( have all the same elements,
 * regardless of the order ) */
export function similarArrays<T>(array1: Array<T>, array2: Array<T>): boolean {
    if (array1.length !== array2.length) {
        return false;
    }
    for (let i = 0; i < array1.length; i += 1) {
        if (array2.indexOf(array1[i]) === -1) {
            return false;
        }
    }
    return true;
}

export function toBuffer(arg: Uint8Array | string): Buffer {
    let result = Buffer.from([]);
    if (typeof arg === 'string') {
        result = Buffer.from(arg, 'hex');
    } else {
        result = Buffer.from(arg);
    }
    return result;
}

/** Serializes any javascript object into an array of bytes */
export function objectToBytes(obj: any): Uint8Array {
    const buffer = mpEncode(obj);
    const arrayBuffer = bufferToArrayBuffer(buffer);
    return new Uint8Array(arrayBuffer);
}

/** Deserializes an array of bytes into a plain javascript
 * object */
export function bytesToObject(bytes: Uint8Array): any {
    return mpDecode(bytes);
}

/**
 * Sequence generator function
 * @param start - Initial number (will be included).
 * @param stop - Final number (will be included).
 * @param step - Step between two consecutive numbers (default 1).
 * @returns - Array filled according to passed arguments with numbers.
 */
export function numRange(
    start: number,
    stop: number,
    step: number = 1,
): Array<number> {
    return Array.from(
        { length: (stop - start) / step + 1 },
        (_, i) => { return start + (i * step); },
    );
}

interface ISaltAndIV {
    salt: Uint8Array;
    iv: Uint8Array;
}

export function getSaltAndIV(
    data: Uint8Array,
    saltLength: number = defSaltLength,
    ivLength: number = defIVLength,
): ISaltAndIV {
    const salt = data.slice(0, saltLength);
    const iv = data.slice(saltLength, saltLength + ivLength);
    return {
        salt,
        iv,
    };
}
