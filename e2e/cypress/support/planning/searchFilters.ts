import {Modal, SubNavBar, ActionMenu} from '../common';
import {AdvancedSearch} from './advancedSearch';

export class SearchFilters extends Modal {
    editor: AdvancedSearch;
    subnav: SubNavBar;

    constructor() {
        super();

        this.editor = new AdvancedSearch(
            () => cy.get('[data-test-id=manage-filters--content-panel]')
        );
        this.subnav = new SubNavBar();
    }

    open() {
        this.subnav.menuBtn.click();
        this.subnav.menu
            .contains('Manage Event & Planning Filters')
            .should('exist')
            .click();
        this.waitTillOpen(30000);
    }

    get addNewFilterButton() {
        return this.element
            .find('[data-test-id=manage-filters--add-new-filter]')
            .should('exist');
    }

    get editScheduleButton() {
        return this.element
            .find('[data-test-id=manage-filters--preview--edit-schedule]')
            .should('exist');
    }

    get saveFilterButton() {
        return this.element
            .find('[data-test-id=manage-filters--save-filter]')
            .should('exist');
    }

    get saveScheduleButton() {
        return this.element
            .find('[data-test-id=manage-filters--save-schedule]')
            .should('exist');
    }

    waitForContentPanelToOpen() {
        return this.editor.searchPanel
            .find('.side-panel__content')
            .should('exist');
    }

    waitForContentPanelToClose() {
        this.editor.searchPanel
            .find('.side-panel__content')
            .should('not.exist');
    }

    items(timeout: number = 40000) {
        return this.element.find('.sd-list-item', {timeout: timeout});
    }

    item(index: number, timeout: number = 40000) {
        return this.items(timeout)
            .eq(index);
    }

    expectItemCount(count: number, timeout: number = 40000) {
        cy.log('SearchFilter.List.expectItemCount');
        this.items(timeout)
            .should('have.length', count);
    }

    expectItemText(index: number, text: string, timeout?: number) {
        cy.log('SearchFilter.List.expectItemText');
        this.item(index, timeout)
            .should('contain.text', text);
    }

    preview(index: number, timeout?: number) {
        cy.log('SearchFilter.List.preview');
        this.item(index, timeout)
            .click();
    }

    edit(index: number, timeout?: number) {
        cy.log('SearchFilter.List.edit');
        this.preview(index, timeout);

        this.editor.searchPanel
            .find('.side-panel__header')
            .should('exist')
            .find('.icon-pencil')
            .should('exist')
            .click();
    }

    getActionMenu(index: number) {
        return new ActionMenu(
            () => this.item(index)
        );
    }

    clickAction(index: number, label: string) {
        cy.log('SearchFilter.List.clickAction');
        this.preview(index);
        const menu = new ActionMenu(() => this.waitForContentPanelToOpen());

        menu.open()
            .getAction(label)
            .click();
    }
}
