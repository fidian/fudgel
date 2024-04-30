import { camelToDash, getAttribute, setAttribute } from './util.js';
import { cloneNode, createElement, createFragment, doc, win } from './elements.js';
import { dispatchCustomEvent } from './actions.js';
import { isString } from './util.js';

interface MatchedRoute {
    e: HTMLElement;
    g: [string, string][];
}

export class RouterComponent extends HTMLElement {
    private _fragment = createFragment();
    private _lastMatched: HTMLElement[] = [];
    private _routeElements: HTMLElement[] = [];
    private _undo: (() => void)[] = [];

    constructor() {
        super();
        let children = this.children;
        let firstChild = children[0];

        if (firstChild.nodeName === 'TEMPLATE') {
            // Use the children within the template
            this._routeElements = Array.from((firstChild as HTMLTemplateElement).content.children) as HTMLElement[];
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
        this._listen(win, 'popstate', this._popState);
        this._listen(doc.body, 'click', this._clickedLink);
        this._route(win.location.pathname);
        this._patch(win.history, 'pushState', this._modifyStateGenerator);
        this._patch(win.history, 'replaceState', this._modifyStateGenerator);
    }

    disconnectedCallback() {
        while (this._undo.length) {
            this._undo.pop()!();
        }
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
                : cloneNode(matchedRoute.e)];
            append = true;
        }

        const e = this._lastMatched[1];

        for (const [key, value] of matchedRoute.g) {
            setAttribute(e, camelToDash(key), value);
        }

        if (append) {
            this.append(e);
        }
    }

    private _clickedLink(e: Event) {
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

    private _listen(
        target: Window | HTMLElement,
        eventName: string,
        unboundListener: (...args: any[]) => void
    ): void {
        const boundListener = unboundListener.bind(this);
        target.addEventListener(eventName, boundListener);
        this._undo.push(() =>
            target.removeEventListener(eventName, boundListener)
        );
    }

    private _match(url: string): MatchedRoute | null {
        for (const routeElement of this._routeElements) {
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

    private _modifyStateGenerator(
        target: object,
        original: (state: any, title: string, url?: string | null) => void
    ) {
        return (state: any, title: string, url?: string | null) => {
            original.call(target, state, title, url);
            this._route(url || '/');
        };
    }

    private _patch(
        target: object,
        methodName: string,
        generator: (
            target: object,
            original: (...args: any[]) => any
        ) => (...args: any[]) => any
    ) {
        const original = (target as any)[methodName];
        (target as any)[methodName] = generator.call(this, target, original);
        this._undo.push(() => ((target as any)[methodName] = original));
    }

    private _popState() {
        this._route(win.location.pathname);
    }

    private _route(url: string) {
        const matchedRoute = this._match(url);

        if (matchedRoute) {
            this._activate(matchedRoute);
        }

        dispatchCustomEvent(doc.body, 'routeChange', url);
    }
}

export const defineRouterComponent = (name = 'router-outlet') => {
    customElements.define(name, RouterComponent);
};
