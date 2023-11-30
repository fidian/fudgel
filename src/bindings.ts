import { Controller } from './controller';
import { hookOn, hooksRun } from './hooks';
import { metadataControllerPatchedBinding } from './metadata';
import { patchSetter } from './setter';

export function addBindings(
    controller: Controller,
    node: Node,
    callback: (thisRef: Object) => void,
    bindingList: Set<string>
) {
    hookOn(controller, node, 'set:', callback);

    for (const binding of bindingList) {
        const hookName = `set:${binding}`;
        patchSetter<Object>(
            metadataControllerPatchedBinding,
            controller,
            binding,
            (thisRef, newValue, oldValue) => {
                hooksRun(hookName, thisRef, newValue, oldValue);
                (thisRef as any).onChange && (thisRef as any).onChange(binding, newValue, oldValue);
            }
        );
        hookOn(controller, node, hookName, callback);
    }
}
