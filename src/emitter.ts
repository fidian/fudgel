import { iterate } from './util.js';

export type EmitterCallback = (...args: any[]) => void;
export type EmitterUnsubscribe = () => void;

export class Emitter<T = string> {
    private _m = new Map<T, EmitterCallback[]>();

    emit(name: T, ...data: any[]) {
        iterate(this._c(name), (cb) => cb(...data));
    }

    off(name: T, callback: EmitterCallback) {
        const list = this._c(name);

        for (let i = list.length - 1; i >= 0; i -= 1) {
            if (list[i] === callback) {
                list.splice(i, 1);
            }
        }
    }

    on = (name: T, callback: EmitterCallback): (() => void) =>
        (this._c(name).push(callback) as unknown as true) &&
        (() => this.off(name, callback));

    private _c = (name: T) =>
        this._m.get(name) || this._m.set(name, []).get(name)!;
}
