/**
 * Compile-time checks for `StrictController`.
 *
 * `Controller` accepts any class, which is convenient and also why a wrongly
 * typed hook is never noticed. A class that `implements StrictController`
 * gets editor completion for the hook names and a compile error when a hook
 * it declares has the wrong signature. (A misspelled hook is still just an
 * unused method as far as TypeScript is concerned; `fudgel/dev` warns about
 * that at runtime.)
 */
import { StrictController, ControllerMetadata, component, metadata } from '../src/fudgel.js';

class Checked implements StrictController {
    [metadata]?: ControllerMetadata;
    value = 'ok';

    onInit() {}
    onParse() {}
    onViewInit() {}
    onChange(_propName: string, _oldValue: unknown, _newValue: unknown) {}
    onUpdate() {}
    onUnlink(_removedNode: Node) {}
    onDestroy() {}
}

// A strict controller is still a controller as far as component() is concerned.
export const defined = component('type-test-strict', { template: '' }, Checked);

class WrongChangeSignature implements StrictController {
    // @ts-expect-error - onChange receives the property name as a string
    onChange(_propName: number) {}
}

class WrongUnlinkSignature implements StrictController {
    // @ts-expect-error - onUnlink receives the removed Node
    onUnlink(_removed: string) {}
}

export const wrong = [WrongChangeSignature, WrongUnlinkSignature];
