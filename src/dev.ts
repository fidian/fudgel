/**
 * Development-time warnings.
 *
 *     import 'fudgel/dev';
 *
 * Import this once, before your components are defined, while developing.
 * It never changes what Fudgel does. It points out the mistakes the
 * production build cannot afford to detect: a property name that HTML
 * lowercased, an expression that quietly evaluates to nothing, a <slot>
 * that cannot work, a route that can never match, a lifecycle hook that is
 * nearly spelled right. Each distinct warning is printed once.
 */
import {
    addDirective,
    allComponents,
    camelToDash,
    Controller,
    CustomElementConfigInternal,
    dashToCamel,
    events,
    generalDirectives,
    GeneralDirective,
    metadata,
    parse,
    RouterComponent,
    structuralDirectives,
    StructuralDirective,
} from './fudgel.js';

const warned = new Set<string>();

const warn = (message: string) => {
    if (!warned.has(message)) {
        warned.add(message);
        console.warn(`Fudgel: ${message}`);
    }
};

const hooks = [
    'onChange',
    'onDestroy',
    'onInit',
    'onParse',
    'onUnlink',
    'onUpdate',
    'onViewInit',
];

// Edit distance between two short strings.
const distance = (a: string, b: string) => {
    const row = [...Array(b.length + 1).keys()];

    for (let i = 0; i < a.length; i += 1) {
        let diagonal = row[0];
        row[0] = i + 1;

        for (let j = 0; j < b.length; j += 1) {
            const above = row[j + 1];
            row[j + 1] = Math.min(
                above + 1,
                row[j] + 1,
                diagonal + (a[i] == b[j] ? 0 : 1)
            );
            diagonal = above;
        }
    }

    return row[b.length];
};

// Same as the router's own path handling; a drift here shows up in the tests.
const routePattern = (path: string, isRegExp: boolean) =>
    new RegExp(
        `^${
            isRegExp
                ? path
                : path
                      .replace(/\*+/g, match =>
                          match.length > 1 ? '.*' : '[^/]*'
                      )
                      .replace(/:[^:\/]+/g, match => `(?<${match.slice(1)}>[^/]+)`)
        }(/.*)?$`
    );

export const enableDevWarnings = () => {
    // Definitions by tag, for looking up what an element declares.
    const definitions = new Map<string, CustomElementConfigInternal>();

    for (const [, , config] of allComponents) {
        definitions.set(config.tag, config);
    }

    events.on(
        'component',
        (
            _element: unknown,
            constructor: { prototype: object },
            config: CustomElementConfigInternal
        ) => {
            definitions.set(config.tag, config);

            // A method that is nearly a lifecycle hook is probably meant to be one.
            for (const name of Object.getOwnPropertyNames(constructor.prototype)) {
                if (/^on[A-Z]/.test(name) && !hooks.includes(name)) {
                    const near = hooks.find(
                        hook =>
                            distance(hook.toLowerCase(), name.toLowerCase()) <= 2
                    );

                    if (near) {
                        warn(
                            `<${config.tag}> defines ${name}(), which is not a lifecycle hook. Did you mean ${near}()?`
                        );
                    }
                }
            }
        }
    );

    // A <slot> in a light DOM template is inert unless slot-like rewrote it.
    events.on('viewInit', (controller: Controller) => {
        const meta = controller[metadata]!;

        if (!meta.useShadow && meta.root.querySelector('slot')) {
            warn(
                `<${meta.tagName}> uses <slot> without a shadow DOM, so nothing is projected. Call defineSlotComponent() before defining components, or set useShadow: true.`
            );
        }
    });

    // HTML lowercases attribute names before Fudgel sees them, so
    // .isSaveable arrives as .issaveable and matches nothing. When the
    // lowercased name matches a declared property, say how to spell it.
    const checkName = (node: HTMLElement, attrName: string, prefix: string) => {
        const config = definitions.get(node.tagName.toLowerCase());

        if (config) {
            const written = attrName.slice(prefix.length);
            const camel = dashToCamel(written);
            const declared = [...config.prop, ...config.attr];

            if (!declared.includes(camel)) {
                const near = declared.find(
                    name => name.toLowerCase() == camel.toLowerCase()
                );

                if (near) {
                    warn(
                        `${prefix}${written} on <${config.tag}> matches no declared property because HTML lowercased it. Write ${prefix}${camelToDash(near)} to reach ${near}.`
                    );
                }
            }
        }
    };

    for (const prefix of ['.', '']) {
        const original = generalDirectives[prefix];
        const checked: GeneralDirective = (controller, node, attrValue, attrName) => {
            checkName(node, attrName, prefix);
            original(controller, node, attrValue, attrName);
        };
        addDirective(prefix, checked);
    }

    // What a controller has as its template is linked: its own properties,
    // including those onInit() assigned, and everything on its prototypes.
    // (Linking itself defines every bound name on the controller, so this
    // is recorded first.)
    const declared = new WeakMap<object, Set<string>>();
    events.on('parse', (controller: Controller) => {
        const names = new Set<string>();

        for (
            let object: any = controller;
            object && object != Object.prototype;
            object = Object.getPrototypeOf(object)
        ) {
            for (const name of Object.getOwnPropertyNames(object)) {
                names.add(name);
            }
        }

        declared.set(controller, names);
    });

    // An identifier that is neither in scope, on the controller, nor a
    // global evaluates to undefined and renders as nothing.
    const parseJs = parse.js;
    parse.js = (expression: string) => {
        const [evaluate, bindings] = parseJs(expression);

        return [
            (...roots: object[]) => {
                // Directives pass their scopes first and the controller last.
                const names = declared.get(roots[roots.length - 1]);
                const scopes = roots.slice(0, -1);

                for (const name of bindings) {
                    if (
                        names &&
                        !names.has(name) &&
                        !scopes.some(scope => name in scope) &&
                        !(name in globalThis)
                    ) {
                        warn(
                            `"${name}" in the expression "${expression}" is not a property of the controller, a loop variable, or a global, so it is undefined.`
                        );
                    }
                }

                return evaluate(...roots);
            },
            bindings,
        ];
    };

    // *for iterates with "of"; "in" parses as the in operator.
    const starFor = structuralDirectives['*for'];
    const checkedFor: StructuralDirective = (controller, anchor, node, attrValue, attrName) => {
        if (/\s+in\s+/.test(attrValue) && !/\s+of\s+/.test(attrValue)) {
            warn(
                `*for="${attrValue}" uses "in"; *for iterates with "of", and as written this renders nothing.`
            );
        }

        starFor(controller, anchor, node, attrValue, attrName);
    };
    addDirective('*for', checkedFor);

    // The first matching route wins and a route matches any longer path,
    // so a later, longer route can be shadowed by an earlier, shorter one.
    const connected = RouterComponent.prototype.connectedCallback;
    RouterComponent.prototype.connectedCallback = function (this: RouterComponent) {
        const earlier: [string, RegExp][] = [];

        for (const route of this.routes) {
            const path = route.getAttribute('path') || '**';
            const isRegExp = route.hasAttribute('regexp');
            const literal = !isRegExp && !/[:*]/.test(path);
            const shadow = literal && earlier.find(([, pattern]) => pattern.test(path));

            if (shadow) {
                warn(
                    `The route "${path}" can never match because "${shadow[0]}" comes before it and matches the same paths. List longer paths first.`
                );
            }

            earlier.push([path, routePattern(path, isRegExp)]);
        }

        connected.call(this);
    };
};

enableDevWarnings();
