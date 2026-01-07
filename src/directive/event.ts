import { Controller } from '../controller-types.js';
import { dashToCamel, pascalToDash, setAttribute, Obj } from '../util.js';
import { doc, win } from '../elements.js';
import { GeneralDirective } from './types.js';
import { getScope } from '../scope.js';
import { parse } from '../parse.js';
import { newSet } from '../sets.js';

// The guards come from Vue.js, an excellent framework.
type KeyedEvent = KeyboardEvent | MouseEvent | TouchEvent;

// When these return truthy values, the guard will STOP and not call the callback.
//
// Not all modifiers make it to the modifier set. Some are entirely handled before the event handler is fired, thus those are removed. The following event modifiers are handled before the event listener is added: 'passive', 'capture', 'once', 'window', and 'document'.
//
// Some modifiers are processed before the event listener is set up but are still needed as a guard. These are: 'self' and 'outside'.
const modifierGuards: Record<
    string,
    (e: Event, node: HTMLElement, modifierSet: Set<string>) => void | boolean
> = {
    // Actions
    stop: e => e.stopPropagation(),
    prevent: e => e.preventDefault(),

    // Targeting
    self: (e, node) => e.target !== node,
    outside: (e, node) => node.contains(e.target as Node),

    // Key modifiers
    ctrl: e => !(e as KeyedEvent).ctrlKey,
    shift: e => !(e as KeyedEvent).shiftKey,
    alt: e => !(e as KeyedEvent).altKey,
    meta: e => !(e as KeyedEvent).metaKey,
    left: e => (e as MouseEvent).button !== 0,
    middle: e => (e as MouseEvent).button !== 1,
    right: e => (e as MouseEvent).button !== 2,
    exact: (e, _node, modifierSet) =>
        ['ctrl', 'shift', 'alt', 'meta'].some(
            m => (e as any)[`${m}Key`] && !modifierSet.has(m)
        ),
};

export const eventDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const [eventName, ...modifiers] = dashToCamel(attrName.slice(1)).split('.');
    const scope = Obj.create(getScope(node));
    const parsed = parse.js(attrValue);
    const fn = (event: Event) => {
        scope.$event = event;
        parsed[0](scope, controller);
    };
    const options: AddEventListenerOptions = {};
    const modifierSet = newSet(modifiers);
    const checkModifier = (key: string) =>
        modifierSet.has(key) && (modifierSet.delete(key), 1);
    let eventTarget: Node | Window | Document = node;

    for (const item of [
        'passive',
        'capture',
        'once',
    ] as (keyof AddEventListenerOptions)[]) {
        if (checkModifier(item)) {
            (options[item] as any) = true;
        }
    }

    if (checkModifier('window')) {
        eventTarget = win;
    }

    // Do not use 'checkModifier' for 'outside' because the modifierGuards handles it
    // during event processing.
    //
    // Be careful with this logic. We are intentionally removing 'document' if
    // it exists in the set, but preserving 'outside'.
    if (checkModifier('document') || modifierSet.has('outside')) {
        eventTarget = doc;
    }

    eventTarget.addEventListener(
        eventName,
        event => {
            if (
                ![...modifierSet].some(modifier =>
                    (
                        modifierGuards[modifier] ||
                        ((e: Event) =>
                            pascalToDash((e as KeyboardEvent).key) !==
                            (modifier.match(/^code-\d+$/)
                                ? String.fromCodePoint(+modifier.split('-')[1])
                                : modifier))
                    )(event, node, modifierSet)
                )
            ) {
                fn(event);
            }
        },
        options
    );
    setAttribute(node, attrName);
};
