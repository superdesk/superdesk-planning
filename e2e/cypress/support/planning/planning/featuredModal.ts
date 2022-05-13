import {Modal} from '../../common';

type IFooterButtonLabels = 'Close' | 'Cancel' | 'Save' | 'Post' | 'Update';
interface IExpectListEntries {
    available: Array<string>;
    selected: Array<string>;
    removed: Array<string> | null;
}

/**
 * Wrapper class around Planning FeaturedStories modal
 */
export class FeaturedModal extends Modal {
    waitTillLoadingFinished() {
        this.element
            .find('.loading-indicator')
            .should('not.exist');
    }

    get subnav() {
        return this.element.find('[data-test-id="featured-modal--subnav"]');
    }

    get currentDate() {
        return this.subnav.find('[data-test-id="featured-modal--current-date"]');
    }

    expectFooterButtons(buttons: Array<IFooterButtonLabels>) {
        (['Close', 'Cancel', 'Save', 'Post', 'Update'] as Array<IFooterButtonLabels>).forEach((name) => {
            if (buttons.indexOf(name) >= 0) {
                this.footer.contains(name).should('exist');
            } else {
                this.footer.contains(name).should('not.exist');
            }
        });
    }

    footerButton(label: IFooterButtonLabels) {
        return this.footer
            .find('button')
            .contains(label);
    }

    expectListEntries(lists: IExpectListEntries) {
        Object.keys(lists).forEach((name: keyof IExpectListEntries) => {
            const expectLength = lists[name]?.length;
            if (expectLength) {
                lists[name].forEach((slugline, index) => {
                    this.getList(name)
                        .should('exist')
                        .find('li')
                        .eq(index)
                        .contains(slugline)
                });
            } else if (expectLength === 0) {
                this.getList(name)
                    .should('exist')
                    .find('li')
                    .should('not.exist');
            } else {
                this.getList(name)
                    .should('not.exist');
            }
        });
    }

    expectListItemHighlighted(listName: keyof IExpectListEntries, index: number) {
        this.getList(listName)
            .find('li')
            .eq(index)
            .should('have.class', 'sd-list-item--activated');
    }

    getList(name: keyof IExpectListEntries) {
        return this.element.find(`[data-test-id="list-${name}"]`);
    }

    addItemToSelected(index: number) {
        this.getList('available')
            .find('li')
            .eq(index)
            .should('exist')
            .find('[data-test-id="btn-add"]')
            .should('exist')
            .click();
    }
}
