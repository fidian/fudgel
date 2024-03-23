export type EmitterCallback = (...args: any[]) => void;
export type EmitterUnsubscribe = () => void;

export class Emitter {
    #m = new Map<string, EmitterCallback[]>();

    emit = (name: string, ...data: any[]) => {
        for (const cb of [...this.#c(name)]) {
            cb(...data);
        }
    };

    off = (name: string, callback: EmitterCallback) => {
        const list = this.#c(name);

        for (let i = list.length - 1; i >= 0; i -= 1) {
            if (list[i] === callback) {
                list.splice(i, 1);
            }
        }
    };

    on = (name: string, callback: EmitterCallback): (() => void) =>
        (this.#c(name).push(callback) as unknown as true) &&
        (() => this.off(name, callback));

    #c = (name: string) =>
        this.#m.get(name) || this.#m.set(name, []).get(name)!;
}
