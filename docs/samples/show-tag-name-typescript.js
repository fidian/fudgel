// TypeScript with decorators. Shows how to use `metadata`
// and have everything typed correctly.
import { Component, ControllerMetadata, metadata } from '/fudgel.min.js';

@Component(
    'show-tag-name-typescript',
    {
        template: `My tag name is {{tagName}}`,
    }
)
class MyCustomComponent {
    audience = 'world';
    [metadata]!: ControllerMetadata;
    tagName = 'Unknown';

    onInit() {
        this.tagName = this[metadata].tagName;
    }
}
