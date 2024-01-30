import { attributeDirective } from './attribute.js';
import { eventDirective } from './event.js';
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

export const STRUCTURAL_DIRECTIVE_INDEX = 0;
export const GENERAL_DIRECTIVE_INDEX = 1;
export const directives: [
    StructuralDirectiveRegistry,
    GeneralDirectiveRegistry,
] = [
    {
        '*for': starForDirective,
        '*if': starIfDirective,
        '*repeat': starRepeatDirective,
    },
    {
        '': attributeDirective,
        '@': eventDirective,
        '#ref': hashRefDirective,
        '.': propertyDirective,
    },
];

export const addDirective = (
    name: string,
    directive: GeneralDirective | StructuralDirective
) =>
    (directives[
        name.charAt(0) === '*'
            ? STRUCTURAL_DIRECTIVE_INDEX
            : GENERAL_DIRECTIVE_INDEX
    ][name] = directive);
