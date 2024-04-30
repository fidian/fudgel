export type EmitterCallback = (...args: any[]) => void;
export type EmitterUnsubscribe = () => void;

export class Emitter {
    private _m = new Map<string, EmitterCallback[]>();

    emit(name: string, ...data: any[]) {
        for (const cb of [...this._c(name)]) {
            cb(...data);
        }
    }

    off(name: string, callback: EmitterCallback) {
        const list = this._c(name);

        for (let i = list.length - 1; i >= 0; i -= 1) {
            if (list[i] === callback) {
                list.splice(i, 1);
            }
        }
    }

    on = (name: string, callback: EmitterCallback): (() => void) =>
        (this._c(name).push(callback) as unknown as true) &&
        (() => this.off(name, callback));

    private _c = (name: string) =>
        this._m.get(name) || this._m.set(name, []).get(name)!;
}
