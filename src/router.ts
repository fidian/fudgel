import { camelToDash, getAttribute, setAttribute } from './util.js';
import { cloneNode, createElement, createFragment, doc, win } from './elements.js';
import { dispatchCustomEvent } from './actions.js';
import { isString } from './util.js';

interface MatchedRoute {
    e: HTMLElement;
    g: [string, string][];
}

export class RouterComponent extends HTMLElement {
    #fragment = createFragment();
    #lastMatched: HTMLElement[] = [];
    #routeElements: HTMLElement[] = [];
    #undo: (() => void)[] = [];

    constructor() {
        super();
        let children = this.children;
        let firstChild = children[0];

        if (firstChild.nodeName === 'TEMPLATE') {
            // Use the children within the template
            this.#routeElements = Array.from((firstChild as HTMLTemplateElement).content.children) as HTMLElement[];
        } else {
            // Use direct children and move elements to a document fragment
            while (children.length > 0) {
                const element = children[0];
                this.#routeElements.push(element as HTMLElement);
                this.#fragment.appendChild(element);
            }
        }
    }

    connectedCallback() {
        this.#listen(win, 'popstate', this.#popState);
        this.#listen(doc.body, 'click', this.#clickedLink);
        this.#route(win.location.pathname);
        this.#patch(win.history, 'pushState', this.#modifyStateGenerator);
        this.#patch(win.history, 'replaceState', this.#modifyStateGenerator);
    }

    disconnectedCallback() {
        while (this.#undo.length) {
            this.#undo.pop()!();
        }
    }

    go(url: string) {
        win.history.pushState(null, '', url);
    }

    #activate(matchedRoute: MatchedRoute) {
        let append = false;

        if (matchedRoute.e !== this.#lastMatched[0]) {
            const title = getAttribute(matchedRoute.e, 'title');
            const component = getAttribute(matchedRoute.e, 'component');
            this.innerHTML = '';

            if (title) {
                doc.title = title;
            }

            this.#lastMatched = [
                matchedRoute.e,
            component
                ? createElement(component)
                : cloneNode(matchedRoute.e)];
            append = true;
        }

        const e = this.#lastMatched[1];

        for (const [key, value] of matchedRoute.g) {
            setAttribute(e, camelToDash(key), value);
        }

        if (append) {
            this.appendChild(e);
        }
    }

    #clickedLink(e: Event) {
        if (!e.defaultPrevented) {
            const link = e
                .composedPath()
                .filter((n: any) => (n as HTMLElement).tagName === 'A')[0] as
                | HTMLAnchorElement
                | undefined;

            if (link) {
                if (link.href && link.origin === win.location.origin) {
                    e.preventDefault();
                    this.go(`${link.pathname}${link.search}${link.hash}`);
                }
            }
        }
    }

    #listen(
        target: Window | HTMLElement,
        eventName: string,
        unboundListener: (...args: any[]) => void
    ): void {
        const boundListener = unboundListener.bind(this);
        target.addEventListener(eventName, boundListener);
        this.#undo.push(() =>
            target.removeEventListener(eventName, boundListener)
        );
    }

    #match(url: string): MatchedRoute | null {
        for (const routeElement of this.#routeElements) {
            const path = getAttribute(routeElement, 'path') || '**';
            const regexpAttr = getAttribute(routeElement, 'regexp');
            let regexpStr = path;

            if (!isString(regexpAttr)) {
                regexpStr = path
                    .replace(/\*+/g, (match) =>
                        match.length > 1 ? '.*' : '[^/]*'
                    )
                    .replace(/:[^:\/]+/g, (match) => `(?<${match.slice(1)}>[^/]+)`);
            }

            const regexp = new RegExp(`^${regexpStr}(/.*)?$`);
            const match = url.match(regexp);

            if (match) {
                return {
                    e: routeElement,
                    g: Object.entries(match.groups || {}),
                };
            }
        }

        return null;
    }

    #modifyStateGenerator(
        target: object,
        original: (state: any, title: string, url?: string | null) => void
    ) {
        return (state: any, title: string, url?: string | null) => {
            original.call(target, state, title, url);
            this.#route(url || '/');
        };
    }

    #patch(
        target: object,
        methodName: string,
        generator: (
            target: object,
            original: (...args: any[]) => any
        ) => (...args: any[]) => any
    ) {
        const original = (target as any)[methodName];
        (target as any)[methodName] = generator.call(this, target, original);
        this.#undo.push(() => ((target as any)[methodName] = original));
    }

    #popState() {
        this.#route(win.location.pathname);
    }

    #route(url: string) {
        const matchedRoute = this.#match(url);

        if (matchedRoute) {
            this.#activate(matchedRoute);
        }

        dispatchCustomEvent(doc.body, 'routeChange', url);
    }
}

export const defineRouterComponent = (name = 'router-outlet') => {
    customElements.define(name, RouterComponent);
};
