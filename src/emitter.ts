export type EmitterCallback = (...args: any[]) => void;
export type EmitterUnsubscribe = () => void;

export class Emitter<T = string> {
    private _m = new Map<T, EmitterCallback[]>();

    // Emits a value to all event listeners. If one listener removes a later
    // listener from the list, the later listener will still be called.
    emit(name: T, ...data: any[]) {
        for (const cb of [...(this._m.get(name) ?? [])]) {
            cb(...data);
        }
    }

    off(name: T, callback: EmitterCallback) {
        const list = this._m.get(name)?.filter(item => item !== callback);

        if (list) {
            this._m.set(name, list);
        } else {
            this._m.delete(name);
        }
    }

    on(name: T, callback: EmitterCallback) {
        (this._m.get(name) ?? this._m.set(name, []).get(name)!).push(callback);
        return () => this.off(name, callback);
    }
}
