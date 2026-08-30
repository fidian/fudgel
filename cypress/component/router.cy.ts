import { Component, defineRouterComponent } from '../../src/fudgel.js';

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
    `
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
    `
})
class TestComponent {
    id;

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
    `
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
    `
})
export class TestTemplate {}

let testHistoryInits = 0;

describe('router', () => {
    beforeEach(() => {
        history.pushState(null, null, '/');
        cy.mount('<test-application></test-application>');
    });

    it('routes with links and sets attributes', () => {
        // Show the default page
        cy.get('#page1').should('not.exist');
        cy.get('test-component').should('not.exist');
        cy.get('#default').should('exist');
        cy.get('#notShown').should('not.exist');

        // Go to page 1
        cy.get('a#page1link').click();
        cy.get('#page1').should('exist');
        cy.get('test-component').should('not.exist');
        cy.get('#default').should('not.exist');
        cy.get('#notShown').should('not.exist');

        // Go to the detail component
        cy.get('a#testingId').click();
        cy.get('#page1').should('not.exist');
        cy.get('test-component').should('exist');
        cy.get('#default').should('not.exist');
        cy.get('#notShown').should('not.exist');

        // Confirm the attribute contains the matching path segment
        cy.get('#id').should('have.text', 'testingId');

        // Back to page 1
        cy.get('button').click();

        // Go to the detail component with a deeper route
        cy.get('a#deeper').click();
        cy.get('#page1').should('not.exist');
        cy.get('test-component').should('exist');
        cy.get('#default').should('not.exist');
        cy.get('#notShown').should('not.exist');

        // Confirm the attribute only shows the first matching path segment
        cy.get('#id').should('have.text', 'deeper');

        // Back to page 1
        cy.get('button').click()

        // Verify that a slash is ignored at the end of a route
        cy.get('#slash').click();
        cy.get('#location').should('have.text', '/page1/');
        cy.get('#page1').should('exist');
        cy.get('test-component').should('not.exist');

        // Back to default route
        cy.get('#startOver').click();
    });

    it('navigates correctly with history', () => {
        // Confirm components do not get instantiated over and over
        let initsBefore;
        cy.get('a#page2link').click();
        cy.get('#inits').then(() => {
            initsBefore = testHistoryInits;
        });
        cy.get('#deeper').click();
        cy.get('#deeper').click();
        cy.get('#inits').then(() => {
            expect(testHistoryInits).to.equal(initsBefore);
        });

        // Confirm navigation back pops from the state
        cy.get('#location').should('have.text', '/page2/deeper');
        cy.get('button#back').click();
        cy.get('#location').should('have.text', '/page2/deeper'); // not changed visibly
        cy.get('button#back').click();
        cy.get('#location').should('have.text', '/page2');
        cy.get('button#forward').click();
        cy.get('#location').should('have.text', '/page2/deeper');
        cy.get('button#pushState').click();
        cy.get('#location').should('have.text', '/');
    });

    it('works with a <template> element', () => {
        // Navigate to the template
        cy.get('a#page3link').click();
        cy.get('#page3default').should('exist');

        // Route to the test element
        cy.get('a#page3link').click();
        cy.get('#123').should('exist');
        cy.get('#id').should('have.text', '123');
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
    beforeEach(() => {
        history.pushState(null, null, '/');
        cy.mount('<test-query-application></test-query-application>');
    });

    it('routes a plain path, as a baseline', () => {
        cy.get('a#plain').click();
        cy.get('#orders').should('exist');
        cy.get('#fallback').should('not.exist');
    });

    it('routes a link carrying a query string, and keeps the query', () => {
        // A query string selects within a route rather than changing which
        // route matched, so this is still the orders route.
        cy.get('a#withQuery').click();
        cy.get('#orders').should('exist');
        cy.get('#fallback').should('not.exist');
        cy.get('#search').should('have.text', '?status=open&sort=date');
    });

    it('routes a link carrying a fragment, and keeps the fragment', () => {
        cy.get('a#withHash').click();
        cy.get('#orders').should('exist');
        cy.get('#fallback').should('not.exist');
        cy.get('#hash').should('have.text', '#totals');
    });

    it('matches path parameters with a query and a fragment present', () => {
        cy.get('a#withBoth').click();
        cy.get('test-component').should('exist');
        // The parameter comes from the path, not from the query beside it.
        cy.get('#id').should('have.text', '7');
        cy.get('#search').should('have.text', '?status=open');
        cy.get('#hash').should('have.text', '#totals');
    });

    it('routes a pushState carrying a query string', () => {
        // The patched history methods receive whatever URL the application
        // passed, which is where an unstripped query used to fall through to
        // the catch-all route.
        cy.get('button#pushQuery').click();
        cy.get('#orders').should('exist');
        cy.get('#fallback').should('not.exist');
        cy.get('#path').should('have.text', '/orders');
        cy.get('#search').should('have.text', '?status=open');
    });

    it('reports the path alone in routeChange', () => {
        cy.get('a#withBoth').click();
        cy.get('#routeChange').should('have.text', '/orders/7');
    });
});

describe('router query parameters', () => {
    beforeEach(() => {
        history.pushState(null, null, '/');
        cy.mount('<test-query-application></test-query-application>');
    });

    it('sets a declared parameter as an attribute', () => {
        cy.get('button#filtered').click();
        cy.get('#qStatus').should('have.text', 'open');
        cy.get('#qSort').should('have.text', 'date');
    });

    it('ignores a parameter the route did not declare', () => {
        cy.get('button#filtered').click();
        cy.get('query-target').should('not.have.attr', 'other');
    });

    it('camel case in the list becomes a dashed attribute', () => {
        cy.get('button#filtered').click();
        cy.get('query-target').should('have.attr', 'sort-order', 'date');
    });

    it('removes the attribute when the parameter goes away', () => {
        cy.get('button#filtered').click();
        cy.get('#qSort').should('have.text', 'date');

        // Same route, fewer parameters. The element is reused, so a stale
        // attribute would otherwise linger.
        cy.get('button#filteredFewer').click();
        cy.get('#qStatus').should('have.text', 'closed');
        cy.get('query-target').should('not.have.attr', 'sort-order');
    });

    it('takes the first value of a repeated parameter', () => {
        // An attribute holds one string. URLSearchParams.get() answers with
        // the first, and anything needing every value reads location.search.
        cy.get('button#filteredRepeated').click();
        cy.get('#qTag').should('have.text', 'one');
    });
});
