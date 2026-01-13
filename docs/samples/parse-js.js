import {
    addDirective,
    component,
    metadata,
    getScope,
    parse,
} from './fudgel.js';

addDirective('#tick', (controller, node, attrValue) => {
    const parsed = parse.js(attrValue);
    // parsed[0] is a function that takes context objects,
    // then evaluates the expression against those contexts.
    // parsed[1] is a list of bound variables, which is not
    // needed for this directive.
    const scope = Object.create(getScope(node));
    const updateFn = tickValue => {
        scope.$event = tickValue;
        parsed[0](scope, controller);
    };
    const interval = setInterval(() => updateFn(Date.now()), 1000);
    controller[metadata].events.on('destroy', () => clearInterval(interval));
});

component(
    'parse-js',
    {
        template: `
            <div #tick="updateTick($event)">
                Last tick: {{tickValue}}
            </div>
        `,
    },
    class {
        tickValue = -1;

        // Called from the #tick directive
        updateTick(tickValue) {
            this.tickValue = tickValue;
        }
    }
);
