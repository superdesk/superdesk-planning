export class TreeSelectDriver {
    private parent: () => Cypress.Chainable<JQuery<HTMLElement>>;
    private selector: string;

    constructor(parent: () => Cypress.Chainable<JQuery<HTMLElement>>, selector: string) {
        this.parent = parent;
        this.selector = selector;
    }

    setValue(value: string | Array<string>) {
        const values = typeof value === 'string' ? [value] : value;
        
        this.parent()
            .find(this.selector)
            .then(($field) => {
                const $clearBtn = $field.find('[data-test-id="clear-value"]');
                if ($clearBtn.length > 0) {
                    cy.wrap($clearBtn).click();
                }
            });

        if (values.length > 0) {
            this.parent()
                .find(this.selector)
                .find('[data-test-id="open-popover"]')
                .click();

            values.forEach((val) => {
                cy.get('[data-test-id="tree-select-popover"] [data-test-id="option"]')
                    .contains(val)
                    .click();
            });
        }
    }
} 
