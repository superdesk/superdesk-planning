import {Modal, SubNavBar, ActionMenu, NewCheckboxInput, TreeSelect} from '../common';

export class ManageContentProfiles extends Modal {
    show(contentType: 'event' | 'planning') {
        const subnav = new SubNavBar();

        subnav.menuBtn.click();
        subnav.menu
            .contains(`Manage ${contentType} profiles`)
            .should('exist')
            .click();

        this.waitTillOpen(30000);
    }

    selectTab(index: number) {
        this.element
            .find('button')
            .eq(index)
            .should('exist')
            .click();
    }

    expectSelectedTab(name) {
        this.element
            .find('[aria-selected="true"]')
            .should('exist')
            .should('contain', name);
    }

    openAddFieldMenu(index: number) {
        this.element
            .find('.btn--icon-only-circle')
            .eq(index)
            .should('exist')
            .click();
    }

    actionMenu() {
        return new ActionMenu(() => this.element);
    }

    addField(name: string) {
        cy.get(`[data-test-id="menu"] [role="menuitem"]:contains("${name}")`)
            .should('exist')
            .click();
    }

    getFieldListItem(fieldName: string) {
        return this.element.find(`[data-test-id="content-list--field-${fieldName}"]`);
    }

    getEditor() {
        return this.element.find('[data-test-id="content-field--editor"]');
    }

    getEditorCheckbox(fieldName: string): NewCheckboxInput {
        return new NewCheckboxInput(
            () => this.element,
            `[data-test-id="content-field--editor"] [data-test-id="field-${fieldName}"]`
        );
    }

    getEditorTreeSelect(fieldName: string, allowMultiple: boolean = false): TreeSelect {
        return new TreeSelect(
            () => this.element,
            `[data-test-id="content-field--editor"] [data-test-id="field-${fieldName}"]`,
            allowMultiple
        );
    }

    saveField() {
        this.getHeaderButton('Save').click();
    }

    getHeaderButton(label: string) {
        return this.element.find('.side-panel__header')
            .contains(label);
            // .should('exist')
    }
}
