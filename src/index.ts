// Load all directives to register them
import {
    addDirective
} from './directive/index';
import { attributeDirective } from './directive/attribute';
import { eventDirective } from './directive/event';
import { hashRefDirective } from './directive/hash-ref';
import { propertyDirective } from './directive/property';
import { starForDirective } from './directive/star-for';
import { starIfDirective } from './directive/star-if';
import { starRepeatDirective } from './directive/star-repeat';

addDirective('', attributeDirective);
addDirective('@', eventDirective);
addDirective('#ref', hashRefDirective);
addDirective('.', propertyDirective);
addDirective('*for', starForDirective);
addDirective('*if', starIfDirective);
addDirective('*repeat', starRepeatDirective);

// Export other parts
export * from './actions';
export * from './attr';
export * from './component';
export * from './constructor';
export * from './controller';
export * from './custom-element';
export { addDirective };
export { metadataControllerContent, metadataControllerElement, metadataControllerRoot } from './metadata';
export * from './parse';
export * from './prop';
