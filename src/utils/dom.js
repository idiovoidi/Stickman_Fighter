import { DomElementMissingError } from '../errors/GameErrors.js';

export function requireElement(selector, root = document) {
    const element = root.querySelector(selector);
    if (!element) throw new DomElementMissingError(`Missing required element "${selector}"`, { selector });
    return element;
}
