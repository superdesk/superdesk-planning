import {Input} from './input';
import {TreeSelectDriver} from './treeSelectDriver';

export class UrgencyTreeSelectInput extends Input {
    private treeSelectDriver: TreeSelectDriver;

    constructor(parent: () => Cypress.Chainable<JQuery<HTMLElement>>, selector: string) {
        super(parent, selector);
        this.treeSelectDriver = new TreeSelectDriver(parent, selector);
    }

    clear() {
        this.treeSelectDriver.setValue('');
    }

    type(value: string) {
        this.treeSelectDriver.setValue(value);
    }

    expect(value: string) {
        this.getParent().find(this.selector).should('contain.text', value);
    }
}
