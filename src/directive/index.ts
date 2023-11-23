import { Controller } from '../controller';

// Anything not starting with a star. A default directive must have the key
// of '' in directives. The return value indicates if the attribute should
// be removed (false = preserve the attribute on the element).
export type GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => void;

// All structural directives start with a star. A comment is created in
// place of the node and used as an anchor.
export type StructuralDirective = (
    controller: Controller,
    anchor: Comment,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => void;

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
    GeneralDirectiveRegistry
] = [{}, {}];

export const addDirective = (name: string, directive: GeneralDirective | StructuralDirective) =>
    (directives[
        name.charAt(0) === '*'
            ? STRUCTURAL_DIRECTIVE_INDEX
            : GENERAL_DIRECTIVE_INDEX
    ][name] = directive);
