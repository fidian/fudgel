import { attributeDirective } from './attribute.js';
import { eventDirective } from './event.js';
import { hashClassDirective } from './hash-class.js';
import { hashRefDirective } from './hash-ref.js';
import { propertyDirective } from './property.js';
import { starForDirective } from './star-for.js';
import { starIfDirective } from './star-if.js';
import { starRepeatDirective } from './star-repeat.js';
import { GeneralDirective, StructuralDirective } from './types.js';

export interface GeneralDirectiveRegistry {
    [key: string]: GeneralDirective;
}

export interface StructuralDirectiveRegistry {
    [key: string]: StructuralDirective;
}

export const structuralDirectives: StructuralDirectiveRegistry = {
    '*for': starForDirective,
    '*if': starIfDirective,
    '*repeat': starRepeatDirective,
};

export const generalDirectives: GeneralDirectiveRegistry = {
    '': attributeDirective,
    '@': eventDirective,
    '#class': hashClassDirective,
    '#ref': hashRefDirective,
    '.': propertyDirective,
};

export const addDirective = (
    name: string,
    directive: GeneralDirective | StructuralDirective
) =>
    (name.charAt(0) == '*'
        ? structuralDirectives
        : generalDirectives)[name] = directive;
