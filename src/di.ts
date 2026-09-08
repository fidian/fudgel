import { throwError } from './errors.js';

type Constructor<T extends Object> = new () => T;

const registered = new Map<Object, Object>();

const circular: Object[] = [];

export const di = <T extends Object>(Key: Constructor<T>): T => {
    if (circular.includes(Key)) {
        const chain = [...circular, Key]
            .map(Key => `${(Key as any).name}`)
            .join(' -> ');
        circular.length = 0;
        throwError(`Circular dependency: ${chain}`);
    }

    circular.push(Key);

    // A constructor that throws must not leave its class on the stack, or
    // every later request for it would look like a cycle.
    try {
        return (registered.get(Key) ||
            registered.set(Key, new Key()).get(Key)) as T;
    } finally {
        circular.pop();
    }
};

export const diOverride = <T extends Object>(Key: Constructor<T>, value: T) => {
    registered.set(Key, value);
}
