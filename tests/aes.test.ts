import {
    AESKey,
} from '../index';

describe('AES', () => {
    it('test1', async () => {
        const k = new AESKey();
        await k.generate();
        const k1 = new AESKey();
        await k1.setRaw(await k.getRaw());
        expect(await k.getRaw()).toEqual(await k1.getRaw());
        expect(await k.getJWK()).toEqual(await k.getJWK());
        const k2 = new AESKey();
        k2.setJWK(await k.getJWK());
        expect(await k.getRaw()).toEqual(await k2.getRaw());
        expect(await k.getJWK()).toEqual(await k2.getJWK());
    });
});
