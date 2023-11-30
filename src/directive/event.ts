import { Controller } from '../controller';
import { createFunction, dashToCamel, setAttribute } from '../util';
import { GeneralDirective } from './index';
import { getScope } from '../scope';

export const eventDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const eventName = dashToCamel(attrName.slice(1));
    const scope = getScope(node);

    // Before minification:
    //
    // export const whatever = (scope: Object, event: Event) => {
    //     if (
    //         (($scope: Object, $event: Event) => {
    //             console.log($scope, $event);
    //             return false;
    //         })(scope, event) === false
    //     ) {
    //         event.preventDefault();
    //         event.stopPropagation();
    //     }
    // };
    //
    // After minification:
    //
    // X=(t,e)=>{var n,o;!1==(n=t,o=e,console.log(n,o),!1)&&(e.preventDefault(),e.stopPropagation())}
    //
    // This next line is based on the above minification.
    //
    // Returning false from an event handler will cancel the event, similar to
    // jQuery, Mithril, and a bit of native event handlers. A fantastic
    // discussion about the usefulness of `return false` at the end is
    // available in a ticket for Mithril.
    // https://github.com/MithrilJS/mithril.js/issues/2681
    const fn = createFunction('s,e', `!1===(($scope,$event)=>{${attrValue}})(s,e)&&(e.preventDefault(),e.stopPropagation())`);
    node.addEventListener(eventName, event => fn.call(controller, scope, event));
    setAttribute(node, attrName);
};
