import { component, defineRouterComponent } from './fudgel.min.js';

defineRouterComponent('app-router');

component('routing-notification', {
    template: `
        <app-router>
            <div path="/fake">
                Just including the router so it sets up the
                events. This demo does not show routing. It
                shows how locations can be monitored with
                events.
            </div>
        </app-router>
        <div>
            Click here to switch routes:<br />
            <a href="/route1">Route 1</a><br />
            <a href="/route2">Route 2</a>
        </div>
        <route-changes></route-changes>
    `
});

component('route-changes', {
    template: `
        Number of route changes: {{count}}
    `
}, class {
    count = 0;
    listener = () => this.count += 1;

    onInit() {
        document.body.addEventListener(
            'routeChange',
            this.listener
        );
    }

    onDestroy() {
        document.body.removeEventListener(
            'routeChange',
            this.listener
        );
    }
});
