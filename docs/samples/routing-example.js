import { component, defineRouterComponent } from './fudgel.min.js';

defineRouterComponent('app-router');

component('routing-example', {
    attr: ['thing'],
    template: `
        <app-router>
            <div path="^(/(index.html|routing.html)?)?$"
                regex title="Page 1">
                Page 1: This is the default route.
                It's a bit more complicated because
                it's showing how to use a regular
                expression.
                <a href="/page2/param">Go to page 2</a>
            </div>
            <div path="/page2/:thing"
                component="page-two" title="Page2">
                Shows the custom component instead of
                these words.
            </div>
            <div path="**" title="Unknown Page">
                Unhandled route.
                <a href="/">Continue to page 1</a>
            </div>
            <div path="**">
                This won't ever be displayed. Only the
                first matching route will be shown.
            </div>
        </app-router>
    `,
});

component(
    'page-two',
    {
        template: `
            Page 2: Go to
            <a href="/unknown">an unknown page</a>.<br />
            Going <a href="#" @click.stop.prevent="goBack()">back</a>
            does not work well in this playground, but it does
            work in a regular app.<br />
            The value from the route is "{{thing}}".
        `,
    },
    class {
        goBack() {
            history.go(-1);
        }
    }
);
