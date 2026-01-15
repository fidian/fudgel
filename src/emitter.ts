import { newSet } from './sets.js';

export type EmitterCallback = (...args: any[]) => void;
export type EmitterUnsubscribe = VoidFunction;

export class Emitter<T = string> {
    private _m = new Map<T, Set<EmitterCallback>>();

    // Emits a value to all event listeners. If one listener removes a later
    // listener from the list, the later listener will still be called.
    emit(name: T, ...data: any[]) {
        for (const cb of [...(this._m.get(name) ?? [])]) {
            cb(...data);
        }
    }

    off(name: T, callback: EmitterCallback) {
        const set = this._m.get(name);

        if (set) {
            set.delete(callback);

            if (!set.size) {
                this._m.delete(name);
            }
        }
    }

    on(name: T, callback: EmitterCallback) {
        (this._m.get(name) ?? this._m.set(name, newSet()).get(name)!).add(callback);
        return () => this.off(name, callback);
    }
}
