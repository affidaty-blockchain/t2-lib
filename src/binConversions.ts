import { encode as b58Encode, decode as b58Decode } from 'bs58';

/**
* Converts a given ArrayBuffer to Buffer
*
* @param arrayBuffer - ArrayBuffer object with data to convert
* @return - data converted to Buffer object
*/
export function arrayBufferToBuffer(arrayBuffer: ArrayBuffer): Buffer {
    return Buffer.from(arrayBuffer);
}

/**
* Converts a given Buffer to ArrayBuffer
*
* @param buffer - Buffer object with data to convert
* @return - data converted to an ArrayBuffer object
*/
export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const arrayBufferView = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; i += 1) {
        arrayBufferView[i] = buffer[i];
    }
    return arrayBuffer;
}

/**
* Encodes buffer as base64 string
*
* @param buffer - Binary data to encode
* @returns - Base64 encoded string
*/
export function bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
}

/**
* Decodes base64 string to Buffer
*
* @param base64String - base64 source string
* @returns - binary data decoded from input string
*/
export function base64ToBuffer(base64String: string): Buffer {
    return Buffer.from(base64String, 'base64');
}

/**
* Encodes buffer as base64url string
*
* @param buffer - Binary data to encode
* @returns - Base64url encoded string
*/
export function bufferToBase64url(buffer: Buffer): string {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
* Decodes base64url string to Buffer
*
* @param base64urlString - base64url source string
* @returns - binary data decoded from input string
*/
export function base64urlToBuffer(base64urlString: string): Buffer {
    return Buffer.from(base64urlString.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
* Encodes buffer as base58 string
*
* @param buffer - Binary data to encode
* @returns - Base58 encoded string
*/
export function bufferToBase58(buffer: Buffer): string {
    return b58Encode(buffer);
}

/**
* Decodes base58 string to Buffer
*
* @param base58String - base58 source string
* @returns - binary data decoded from input string
*/
export function base58ToBuffer(base58String: string): Buffer {
    return b58Decode(base58String);
}

/**
* Encodes ArrayBuffer as base64 string
*
* @param arrayBuffer - Binary data to encode
* @returns - Base64 encoded string
*/
export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
    return arrayBufferToBuffer(arrayBuffer).toString('base64');
}

/**
* Decodes base64 string to ArrayBuffer
*
* @param base64String - base64 source string
* @returns - binary data decoded from input string
*/
export function base64ToArrayBuffer(base64String: string): ArrayBuffer {
    return bufferToArrayBuffer(Buffer.from(base64String, 'base64'));
}

/**
* Encodes ArrayBuffer as base64url string
*
* @param arrayBuffer - Binary data to encode
* @returns - Base64url encoded string
*/
export function arrayBufferToBase64url(arrayBuffer: ArrayBuffer): string {
    return bufferToBase64url(arrayBufferToBuffer(arrayBuffer));
}

/**
* Decodes base64url string to ArrayBuffer
*
* @param base64urlString - base64url source string
* @returns - binary data decoded from input string
*/
export function base64urlToArrayBuffer(base64urlString: string): ArrayBuffer {
    return bufferToArrayBuffer(base64urlToBuffer(base64urlString));
}

/**
* Encodes ArrayBuffer as base58 string
*
* @param arrayBuffer - Binary data to encode
* @returns - Base58 encoded string
*/
export function arrayBufferToBase58(arrayBuffer: ArrayBuffer): string {
    return bufferToBase58(arrayBufferToBuffer(arrayBuffer));
}

/**
* Decodes base58 string to ArrayBuffer
*
* @param base58String - base58 source string
* @returns - binary data decoded from input string
*/
export function base58ToArrayBuffer(base58String: string): ArrayBuffer {
    return bufferToArrayBuffer(base58ToBuffer(base58String));
}

/**
 * Converts an ArrayBuffer to a string
 * @param arrayBuffer - initial ArrayBuffer
 * @returns - resulting string
 */
export function arrayBufferToString(arrayBuffer: ArrayBuffer): string {
    const b = Buffer.from(arrayBuffer);
    return b.toString();
}

/**
 * Converts a string to an ArrayBuffer
 * @param str - initial string
 * @returns - resulting ArrayBuffer
 */
export function stringToArrayBuffer(str: string): ArrayBuffer {
    const b = Buffer.from(str);
    return new Uint8Array(b).buffer;
}
