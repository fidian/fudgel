import { Attr, Component, defineRouterComponent } from '../../src/fudgel';

defineRouterComponent('app-router');

@Component('test-application', {
    template: `
    <div>Current route: <span id="location">{{this.location}}</span><br />
    History length: <span id="historyLength">{{this.historyLength}}</span></div>
    <app-router>
        <div path="/page1/:id" component="test-component"></div>
        <div path="/page1" id="page1">
            View detail for <a id="testingId" href="/page1/testingId">testingId</a><br />
            View detail for <a id="deeper" href="/page1/deeper/things/here">deeper path</a><br />
            Back to <a href="/">the default route</a>
        </div>
        <div path="/page2" component="test-history"></div>
        <div id="default">
            Default fallback route<br />
            <a id="page1link" href="/page1">Page 1</a> test links, routes, attributes<br />
            <a id="page2link" href="/page2">Page 2</a> test history and navigation
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
    template: `
        id attribute is <span id="id">{{this.id}}</span><br />
        <button @click.stop.prevent="this.goBack()">Go Back</button>
    `
})
class TestComponent {
    @Attr() id;

    goBack() {
        history.back();
    }
}

@Component('test-history', {
    template: `
        History inits: <span id="inits">{{this.inits}}</span><br />
        <a id="deeper" href="/page2/deeper">Go deeper</a><br />
        <button id="back" @click.stop.prevent="history.back()">history.back()</button><br />
        <button id="forward" @click.stop.prevent="history.forward()">history.forward()</button><br />
        <button id="pushState" @click.stop.prevent="history.pushState(null, '', '/')">history.pushState(null, '', '/')</button><br />
        Back to the <a href="/">default route</a>
    `
})
class TestHistoryComponent {
    inits = 0;

    onInit() {
        testHistoryInits += 1;
        this.inits = testHistoryInits;
    }
}

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

        // Back to default route
        cy.get('#startOver').click();
    });

    it('navigates correctly with history', () => {
        // Confirm components do not get instantiated over and over
        let initsBefore;
        cy.get('a#page2link').click();
        cy.get('#inits').then(() => {
            console.log(testHistoryInits);
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
});
