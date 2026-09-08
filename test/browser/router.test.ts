import { describe, beforeEach, expect, it } from 'vitest';
import { Component, defineRouterComponent } from '../../src/fudgel.js';
import { $, click, expectAttr, expectCount, expectExists, expectMissing, expectText, expectValue, mount, tick } from '../support/dom.js';

defineRouterComponent('app-router');

@Component('test-application', {
    template: `
    <div>Current route: <span id="location">{{location}}</span><br />
    History length: <span id="historyLength">{{historyLength}}</span></div>
    <app-router>
        <div path="/page1/:id" component="test-component"></div>
        <div path="/page1" id="page1">
            View detail for <a id="testingId" href="/page1/testingId">testingId</a><br />
            View detail for <a id="deeper" href="/page1/deeper/things/here">deeper path</a><br />
            Do not view detail with <a id="slash" href="/page1/">an extra slash</a><br />
            Back to <a href="/">the default route</a>
        </div>
        <div path="/page2" component="test-history"></div>
        <div path="/page3" component="test-template"></div>
        <div id="default">
            Default fallback route<br />
            <a id="page1link" href="/page1">Page 1</a> test links, routes, attributes<br />
            <a id="page2link" href="/page2">Page 2</a> test history and navigation
            <a id="page3link" href="/page3">Page 3</a> test template and nested routes
        </div>
        <div id="notShown">
            Never shown
        </div>
    </app-router>
    <div><a id="startOver" href="/">Start Over</a></div>
    `,
})
class TestApplicationComponent {
    historyLength = -1;
    interval: ReturnType<typeof setInterval>;
    location: string;

    onInit() {
        this.interval = setInterval(() => {
            this.location = window.location.pathname;
            this.historyLength = history.length;
        }, 50);
    }

    onDestroy() {
        clearInterval(this.interval);
    }
}

@Component('test-component', {
    attr: ['id'],
    template: `
        id attribute is <span id="id">{{id}}</span><br />
        <button @click.stop.prevent="goBack()">Go Back</button>
    `,
})
class TestComponent {
    id: string;

    goBack() {
        history.back();
    }
}

@Component('test-history', {
    template: `
        History inits: <span id="inits">{{inits}}</span><br />
        <a id="deeper" href="/page2/deeper">Go deeper</a><br />
        <button id="back" @click.stop.prevent="history.back()">history.back()</button><br />
        <button id="forward" @click.stop.prevent="history.forward()">history.forward()</button><br />
        <button id="pushState" @click.stop.prevent="history.pushState(null, '', '/')">history.pushState(null, '', '/')</button><br />
        Back to the <a href="/">default route</a>
    `,
})
class TestHistoryComponent {
    history = history;
    inits = 0;

    onInit() {
        testHistoryInits += 1;
        this.inits = testHistoryInits;
    }
}

@Component('test-template', {
    template: `
        <app-router>
            <template>
                <test-component id="testComponent" path="/page3/:id"></test-component>
                <div id="page3default">
                    <a id="page3link" href="/page3/123">Show ID 123</a>
                </div>
            </template>
        </app-router>
    `,
})
export class TestTemplate {}

let testHistoryInits = 0;

describe('router', () => {
    beforeEach(async () => {
        history.pushState(null, null, '/');
        await mount('<test-application></test-application>');
    });

    it('routes with links and sets attributes', async () => {
        // Show the default page
        await expectMissing('#page1');
        await expectMissing('test-component');
        await expectExists('#default');
        await expectMissing('#notShown');

        // Go to page 1
        await click('a#page1link');
        await expectExists('#page1');
        await expectMissing('test-component');
        await expectMissing('#default');
        await expectMissing('#notShown');

        // Go to the detail component
        await click('a#testingId');
        await expectMissing('#page1');
        await expectExists('test-component');
        await expectMissing('#default');
        await expectMissing('#notShown');

        // Confirm the attribute contains the matching path segment
        await expectText('#id', 'testingId');

        // Back to page 1
        await click('button');

        // Go to the detail component with a deeper route
        await click('a#deeper');
        await expectMissing('#page1');
        await expectExists('test-component');
        await expectMissing('#default');
        await expectMissing('#notShown');

        // Confirm the attribute only shows the first matching path segment
        await expectText('#id', 'deeper');

        // Back to page 1
        await click('button');

        // Verify that a slash is ignored at the end of a route
        await click('#slash');
        await expectText('#location', '/page1/');
        await expectExists('#page1');
        await expectMissing('test-component');

        // Back to default route
        await click('#startOver');
    });

    it('navigates correctly with history', async () => {
        // Confirm components do not get instantiated over and over
        await click('a#page2link');
        await expectExists('#inits');
        const initsBefore = testHistoryInits;
        await click('#deeper');
        await click('#deeper');
        await expectExists('#inits');
        expect(testHistoryInits).toBe(initsBefore);

        // Confirm navigation back pops from the state
        await expectText('#location', '/page2/deeper');
        await click('button#back');
        await expectText('#location', '/page2/deeper'); // not changed visibly
        await click('button#back');
        await expectText('#location', '/page2');
        await click('button#forward');
        await expectText('#location', '/page2/deeper');
        await click('button#pushState');
        await expectText('#location', '/');
    });

    it('works with a <template> element', async () => {
        // Navigate to the template
        await click('a#page3link');
        await expectExists('#page3default');

        // Route to the test element
        await click('a#page3link');
        await expectExists('[id="123"]');
        await expectText('#id', '123');
    });
});

@Component('query-target', {
    attr: ['status', 'sortOrder', 'tag'],
    template: `
        status=<span id="qStatus">{{status}}</span>
        sortOrder=<span id="qSort">{{sortOrder}}</span>
        tag=<span id="qTag">{{tag}}</span>
    `,
})
class QueryTargetComponent {
    sortOrder = '';
    status = '';
    tag = '';
}

@Component('test-query-application', {
    template: `
    <div>
        Path: <span id="path">{{path}}</span><br />
        Search: <span id="search">{{search}}</span><br />
        Hash: <span id="hash">{{hash}}</span><br />
        Last routeChange: <span id="routeChange">{{routeChange}}</span>
    </div>
    <app-router>
        <div path="/orders/:id" component="test-component"></div>
        <div
            path="/filtered"
            component="query-target"
            query="status,sortOrder,tag"
        ></div>
        <div path="/orders" id="orders">
            Orders
        </div>
        <div id="fallback">Fallback</div>
    </app-router>
    <a id="plain" href="/orders">Orders</a>
    <a id="withQuery" href="/orders?status=open&sort=date">Open orders</a>
    <a id="withHash" href="/orders#totals">Order totals</a>
    <a id="withBoth" href="/orders/7?status=open#totals">One order</a>
    <button id="pushQuery" @click.stop.prevent="push('/orders?status=open')">
        Push with a query
    </button>
    <button id="filtered" @click.stop.prevent="push('/filtered?status=open&sortOrder=date&other=ignored')">
        Filtered
    </button>
    <button id="filteredFewer" @click.stop.prevent="push('/filtered?status=closed')">
        Filtered, fewer parameters
    </button>
    <button id="filteredRepeated" @click.stop.prevent="push('/filtered?tag=one&tag=two')">
        Filtered, repeated parameter
    </button>
    `,
})
class TestQueryApplicationComponent {
    hash = '';
    interval: ReturnType<typeof setInterval>;
    path = '';
    routeChange = '';
    search = '';

    onInit() {
        document.body.addEventListener('routeChange', this.onRouteChange);
        this.interval = setInterval(() => {
            this.path = window.location.pathname;
            this.search = window.location.search;
            this.hash = window.location.hash;
        }, 50);
    }

    onDestroy() {
        document.body.removeEventListener('routeChange', this.onRouteChange);
        clearInterval(this.interval);
    }

    onRouteChange = (event: Event) => {
        this.routeChange = (event as CustomEvent<string>).detail;
    };

    push(url: string) {
        history.pushState(null, '', url);
    }
}

describe('router with query strings and fragments', () => {
    beforeEach(async () => {
        history.pushState(null, null, '/');
        await mount('<test-query-application></test-query-application>');
    });

    it('routes a plain path, as a baseline', async () => {
        await click('a#plain');
        await expectExists('#orders');
        await expectMissing('#fallback');
    });

    it('routes a link carrying a query string, and keeps the query', async () => {
        // A query string selects within a route rather than changing which
        // route matched, so this is still the orders route.
        await click('a#withQuery');
        await expectExists('#orders');
        await expectMissing('#fallback');
        await expectText('#search', '?status=open&sort=date');
    });

    it('routes a link carrying a fragment, and keeps the fragment', async () => {
        await click('a#withHash');
        await expectExists('#orders');
        await expectMissing('#fallback');
        await expectText('#hash', '#totals');
    });

    it('matches path parameters with a query and a fragment present', async () => {
        await click('a#withBoth');
        await expectExists('test-component');
        // The parameter comes from the path, not from the query beside it.
        await expectText('#id', '7');
        await expectText('#search', '?status=open');
        await expectText('#hash', '#totals');
    });

    it('routes a pushState carrying a query string', async () => {
        // The patched history methods receive whatever URL the application
        // passed, which is where an unstripped query used to fall through to
        // the catch-all route.
        await click('button#pushQuery');
        await expectExists('#orders');
        await expectMissing('#fallback');
        await expectText('#path', '/orders');
        await expectText('#search', '?status=open');
    });

    it('reports the path alone in routeChange', async () => {
        await click('a#withBoth');
        await expectText('#routeChange', '/orders/7');
    });
});

describe('router query parameters', () => {
    beforeEach(async () => {
        history.pushState(null, null, '/');
        await mount('<test-query-application></test-query-application>');
    });

    it('sets a declared parameter as an attribute', async () => {
        await click('button#filtered');
        await expectText('#qStatus', 'open');
        await expectText('#qSort', 'date');
    });

    it('ignores a parameter the route did not declare', async () => {
        await click('button#filtered');
        await expectExists('query-target');
        await expectAttr('query-target', 'other', null);
    });

    it('camel case in the list becomes a dashed attribute', async () => {
        await click('button#filtered');
        await expectAttr('query-target', 'sort-order', 'date');
    });

    it('removes the attribute when the parameter goes away', async () => {
        await click('button#filtered');
        await expectText('#qSort', 'date');

        // Same route, fewer parameters. The element is reused, so a stale
        // attribute would otherwise linger.
        await click('button#filteredFewer');
        await expectText('#qStatus', 'closed');
        await expectAttr('query-target', 'sort-order', null);
    });

    it('takes the first value of a repeated parameter', async () => {
        // An attribute holds one string. URLSearchParams.get() answers with
        // the first, and anything needing every value reads location.search.
        await click('button#filteredRepeated');
        await expectText('#qTag', 'one');
    });
});

@Component('link-kinds', {
    template: `
    <app-router>
        <div path="/page1" id="linkPage1">page 1</div>
        <div id="linkDefault">default</div>
    </app-router>
    <a id="plainLink" href="/page1">plain</a>
    <a id="blankLink" href="/page1" target="_blank">new tab</a>
    <a id="downloadLink" href="/page1" download>download</a>
    <a id="externalLink" href="/page1" rel="external">external</a>
    <a id="hashLink" href="#totals">totals</a>
    <a id="otherPathHashLink" href="/page1#totals">totals on page 1</a>
    `,
})
class LinkKindsComponent {}

// Dispatch a click the way the browser would, then report whether the
// router claimed it. The window listener runs after the router's body
// listener and cancels the default action so no test navigates for real.
const routerClaimed = (selector: string, init: MouseEventInit = {}) => {
    let claimed: boolean | undefined;
    window.addEventListener(
        'click',
        e => {
            claimed = e.defaultPrevented;
            e.preventDefault();
        },
        { once: true }
    );
    $(selector)!.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, ...init })
    );

    return claimed;
};

describe('history calls', () => {
    beforeEach(async () => {
        history.pushState(null, null, '/');
        await mount('<test-application></test-application>');
    });

    it('keeps the route on replaceState without a URL', async () => {
        await click('a#page1link');
        await expectExists('#page1');
        history.replaceState({ scrollTop: 10 }, '');
        await tick();
        await expectExists('#page1');
        await expectMissing('#default');
    });

    it('resolves a relative pushState against the current URL', async () => {
        history.pushState(null, '', 'page1/rel');
        expect(location.pathname).toBe('/page1/rel');
        await expectText('#id', 'rel');
    });

    it('keeps the route when only the query string changes', async () => {
        await click('a#page1link');
        await expectExists('#page1');
        history.pushState(null, '', '?q=1');
        expect(location.search).toBe('?q=1');
        await tick();
        await expectExists('#page1');
        await expectMissing('#default');
    });
});

describe('links the router leaves to the browser', () => {
    beforeEach(async () => {
        history.pushState(null, null, '/');
        await mount('<link-kinds></link-kinds>');
        await expectExists('#linkDefault');
    });

    it('claims a plain click', () => {
        expect(routerClaimed('#plainLink')).toBe(true);
    });

    it('leaves a click with a modifier key or another button alone', () => {
        expect(routerClaimed('#plainLink', { ctrlKey: true })).toBe(false);
        expect(routerClaimed('#plainLink', { metaKey: true })).toBe(false);
        expect(routerClaimed('#plainLink', { shiftKey: true })).toBe(false);
        expect(routerClaimed('#plainLink', { altKey: true })).toBe(false);
        expect(routerClaimed('#plainLink', { button: 1 })).toBe(false);
    });

    it('leaves target, download and rel=external links alone', () => {
        expect(routerClaimed('#blankLink')).toBe(false);
        expect(routerClaimed('#downloadLink')).toBe(false);
        expect(routerClaimed('#externalLink')).toBe(false);
    });

    it('leaves a same-page fragment link alone, and claims one to another path', async () => {
        expect(routerClaimed('#hashLink')).toBe(false);

        // The browser handles the fragment, so it scrolls and the path stays.
        $('#hashLink')!.click();
        await tick();
        expect(location.hash).toBe('#totals');
        expect(location.pathname).toBe('/');
        await expectExists('#linkDefault');

        // A fragment on another path is a navigation, and the router's
        // pushState happens as part of claiming it.
        expect(routerClaimed('#otherPathHashLink')).toBe(true);
        expect(location.pathname).toBe('/page1');
        await expectExists('#linkPage1');
        history.pushState(null, '', '/');
    });
});

describe('nested routers', () => {
    it('stop routing once removed, even when the outer router disconnects first', async () => {
        history.pushState(null, null, '/');
        await mount('<test-application></test-application>');
        history.pushState(null, '', '/page3/123');
        await expectText('#id', '123');

        const changes: string[] = [];
        const log = (e: Event) => changes.push((e as CustomEvent<string>).detail);
        document.body.addEventListener('routeChange', log);

        // Removing the application disconnects the outer router before the
        // inner one. Nothing is left to route, so nothing announces a route.
        document.body.innerHTML = '';
        history.pushState(null, '', '/page2');
        await tick();
        expect(changes).toEqual([]);

        // A fresh application routes on its own, exactly once per change.
        await mount('<test-application></test-application>');
        changes.length = 0;
        history.pushState(null, '', '/page1');
        await expectExists('#page1');
        expect(changes).toEqual(['/page1']);
        document.body.removeEventListener('routeChange', log);
    });

    it('navigate once for one click even with two routers listening', async () => {
        history.pushState(null, null, '/');
        await mount('<test-application></test-application><test-application></test-application>');
        await expectCount('#default', 2);
        const changes: string[] = [];
        const log = (e: Event) => changes.push((e as CustomEvent<string>).detail);
        document.body.addEventListener('routeChange', log);
        await click('a#page1link');
        await expectCount('#page1', 2);
        document.body.removeEventListener('routeChange', log);

        // One navigation, announced once by each router; a second pushState
        // would have doubled this.
        expect(changes).toEqual(['/page1', '/page1']);
    });
});
