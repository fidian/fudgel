import { throwError } from './errors.js';

type Constructor<T extends Object> = new () => T;

const registered = new Map<Object, Object>();

const circular: Object[] = [];

export const di = <T extends Object>(Key: Constructor<T>): T => {
    if (circular.includes(Key)) {
        circular.push(Key);
        throwError(
            `Circular dependency: ${circular
                .map((Key) => `${(Key as any).name}`)
                .join(' -> ')}`
        );
    }

    circular.push(Key);
    const value =
        registered.get(Key) ||
        registered.set(Key, new Key()).get(Key);
    circular.pop();

    return value as T;
};

export const diOverride = <T extends Object>(Key: Constructor<T>, value: T) => {
    registered.set(Key, value);
}
