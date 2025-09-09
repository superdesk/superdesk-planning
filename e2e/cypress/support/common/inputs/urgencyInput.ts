import {TreeSelectDriver} from './treeSelectDriver';

export class UrgencyInput {
    private treeSelectDriver: TreeSelectDriver;
    private parent: () => Cypress.Chainable<JQuery<HTMLElement>>;
    private selector: string;

    constructor(parent: () => Cypress.Chainable<JQuery<HTMLElement>>, selector: string) {
        this.parent = parent;
        this.selector = selector;
        this.treeSelectDriver = new TreeSelectDriver(parent, selector);
    }

    type(value: string) {
        this.treeSelectDriver.setValue(value);
    }

    expect(value: string) {
        this.parent().find(this.selector).should('contain.text', value);
    }
}
