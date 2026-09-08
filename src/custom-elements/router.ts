import {
    camelToDash,
    entries,
    getAttribute,
    isString,
    setAttribute,
    isTemplate,
} from '../util.js';
import {
    cloneNode,
    createElement,
    createDocumentFragment,
    doc,
    win,
} from '../elements.js';
import { emit } from '../actions.js';
import { newSet } from '../sets.js';

interface MatchedRoute {
    // The element that matched the route
    e: HTMLElement;
    // Route parameters extracted from the path, if any, as key-value pairs
    g: [string, string][];
    // Query parameters that the route is interested in, if any
    q: string[];
}

// Extending a global that does not exist would throw while the module is
// still being evaluated, which is the one thing a Node import must survive.
const HTMLElementBase = (win.HTMLElement || Object) as typeof HTMLElement;

// Every connected router, in connection order: an outer router before the
// inner one it created.
const routers = /*@__PURE__*/ newSet<RouterComponent>();
let installed: boolean | undefined;

// Route every router against the current location. A snapshot is walked
// because an outer router activating a route can connect an inner router,
// which routes itself as it connects.
const routeAll = () => {
    for (const router of [...routers]) {
        router._route();
    }
};

const clickedLink = (e: MouseEvent) => {
    const link = e
        .composedPath()
        .filter((n: any) => (n as HTMLElement).tagName == 'A')[0] as
        | HTMLAnchorElement
        | undefined;

    // Leave to the browser: anything already handled, a click meant to open
    // a new tab or window (modifier keys, another button, a target), a
    // download, a link marked external, another origin, and a fragment on
    // the current page, which needs the browser to scroll.
    if (
        link &&
        !e.defaultPrevented &&
        !e.button &&
        !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) &&
        (!link.target || link.target == '_self') &&
        !link.hasAttribute('download') &&
        !/\bexternal\b/.test(link.rel) &&
        link.href &&
        link.origin == win.location.origin &&
        !link.href.startsWith('blob:') &&
        !(
            link.hash &&
            link.pathname == win.location.pathname &&
            link.search == win.location.search
        )
    ) {
        e.preventDefault();
        win.history.pushState(
            null,
            '',
            `${link.pathname}${link.search}${link.hash}`
        );
    }
};

// The history patch and the two listeners are installed once for the page,
// not once per router. Per-router patches restored their originals in
// disconnection order, which is parent first, so tearing down nested
// routers left a dead router's wrapper on history.pushState.
const install = () => {
    win.addEventListener('popstate', routeAll);
    doc.body.addEventListener('click', clickedLink);

    for (const method of ['pushState', 'replaceState'] as const) {
        const original = win.history[method];
        win.history[method] = function (this: History, ...args: any[]) {
            original.apply(this, args as [any, string, string?]);
            routeAll();
        };
    }
};

export class RouterComponent extends HTMLElementBase {
    private _fragment = createDocumentFragment();
    private _lastMatched: HTMLElement[] = [];
    private _routeElements: HTMLElement[] = [];

    constructor() {
        super();
        let children = this.children;
        let firstChild = children[0];

        if (isTemplate(firstChild)) {
            // Use the children within the template
            this._routeElements = Array.from(
                (firstChild as HTMLTemplateElement).content.children
            ) as HTMLElement[];
        } else {
            // Use direct children and move elements to a document fragment
            while (children.length > 0) {
                const element = children[0];
                this._routeElements.push(element as HTMLElement);
                this._fragment.append(element);
            }
        }
    }

    connectedCallback() {
        if (!installed) {
            installed = true;
            install();
        }

        routers.add(this);
        this._route();
    }

    disconnectedCallback() {
        routers.delete(this);
    }

    go(url: string) {
        win.history.pushState(null, '', url);
    }

    private _activate(matchedRoute: MatchedRoute) {
        let append = false;

        if (matchedRoute.e !== this._lastMatched[0]) {
            const title = getAttribute(matchedRoute.e, 'title');
            const component = getAttribute(matchedRoute.e, 'component');
            this.innerHTML = '';

            if (title) {
                doc.title = title;
            }

            this._lastMatched = [
                matchedRoute.e,
                component
                    ? createElement(component)
                    : cloneNode(matchedRoute.e),
            ];
            append = true;
        }

        const e = this._lastMatched[1];

        // Careful - iterating over an array of entries
        for (const [key, value] of matchedRoute.g) {
            setAttribute(e, camelToDash(key), value);
        }

        const params = new URLSearchParams(win.location.search);

        for (const key of matchedRoute.q) {
            // get() returns null when the parameter is absent, and
            // setAttribute would then remove that attribute.
            setAttribute(e, camelToDash(key), params.get(key));
        }

        if (append) {
            this.append(e);
        }
    }

    private _match(url: string): MatchedRoute | undefined {
        for (const routeElement of this._routeElements) {
            const path = getAttribute(routeElement, 'path') || '**';
            const regexpAttr = getAttribute(routeElement, 'regexp');
            let regexpStr = path;

            if (!isString(regexpAttr)) {
                regexpStr = path
                    .replace(/\*+/g, match =>
                        match.length > 1 ? '.*' : '[^/]*'
                    )
                    .replace(
                        /:[^:\/]+/g,
                        match => `(?<${match.slice(1)}>[^/]+)`
                    );
            }

            const regexp = new RegExp(`^${regexpStr}(/.*)?$`);
            const match = url.match(regexp);

            if (match) {
                return {
                    e: routeElement,
                    g: entries(match.groups || {}),
                    q: getAttribute(routeElement, 'query')?.split(',') || [],
                };
            }
        }

        // Returning undefined is falsy
    }

    // Routes match on the path alone. A query string and a fragment both
    // select something *within* a route rather than changing which route
    // matched, so `/orders?status=open` is the orders route. The path is
    // read back from the browser after every change, so a relative URL or
    // a replaceState() with no URL at all is resolved the way the browser
    // resolved it.
    _route() {
        const path = win.location.pathname;
        const matchedRoute = this._match(path);

        if (matchedRoute) {
            this._activate(matchedRoute);
        }

        emit(doc.body, 'routeChange', path);
    }
}

export const defineRouterComponent = (name = 'router-outlet') => {
    customElements.define(name, RouterComponent);
};
