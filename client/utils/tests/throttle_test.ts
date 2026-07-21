import {throttlePromise} from '../throttle';

const COOLDOWN_MS = 50;

interface IDeferred {
    promise: Promise<any>;
    resolve(value?: any): void;
    reject(reason?: any): void;
}

function createDeferred(): IDeferred {
    const deferred: Partial<IDeferred> = {};

    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    return deferred as IDeferred;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

describe('utils.throttlePromise', () => {
    let deferreds: Array<IDeferred>;
    let callCount: number;
    let throttled: () => Promise<any>;

    beforeEach(() => {
        deferreds = [];
        callCount = 0;
        throttled = throttlePromise(() => {
            callCount++;
            const deferred = createDeferred();

            deferreds.push(deferred);

            return deferred.promise;
        }, COOLDOWN_MS);
    });

    it('executes the first call immediately', (done) => {
        (async () => {
            const result = throttled();

            expect(callCount).toBe(1);

            deferreds[0].resolve('one');
            expect(await result).toBe('one');
        })().then(done, done.fail);
    });

    it('collapses calls received during an execution into a single follow-up', (done) => {
        (async () => {
            const first = throttled();
            const second = throttled();
            const third = throttled();

            expect(callCount).toBe(1);
            expect(second).toBe(third);

            deferreds[0].resolve('one');
            expect(await first).toBe('one');

            // The follow-up does not start until the cooldown has elapsed
            expect(callCount).toBe(1);
            await delay(COOLDOWN_MS * 2);
            expect(callCount).toBe(2);

            deferreds[1].resolve('two');
            expect(await second).toBe('two');
            expect(await third).toBe('two');
        })().then(done, done.fail);
    });

    it('waits for a slow execution to finish before starting the follow-up', (done) => {
        (async () => {
            const first = throttled();
            const second = throttled();

            // Cooldown elapses while the first execution is still running
            await delay(COOLDOWN_MS * 2);
            expect(callCount).toBe(1);

            deferreds[0].resolve('one');
            await first;
            await delay(0);
            expect(callCount).toBe(2);

            deferreds[1].resolve('two');
            expect(await second).toBe('two');
        })().then(done, done.fail);
    });

    it('executes immediately again when idle and cooled down', (done) => {
        (async () => {
            const first = throttled();

            deferreds[0].resolve('one');
            await first;
            await delay(COOLDOWN_MS * 2);

            const second = throttled();

            expect(callCount).toBe(2);

            deferreds[1].resolve('two');
            expect(await second).toBe('two');
        })().then(done, done.fail);
    });

    it('propagates a rejection to that cycle and recovers afterwards', (done) => {
        (async () => {
            const first = throttled();
            const second = throttled();
            let caught;

            deferreds[0].reject('oops');
            try {
                await first;
            } catch (error) {
                caught = error;
            }
            expect(caught).toBe('oops');

            await delay(COOLDOWN_MS * 2);
            expect(callCount).toBe(2);

            deferreds[1].resolve('two');
            expect(await second).toBe('two');
        })().then(done, done.fail);
    });
});
