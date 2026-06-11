import type {Page, Locator} from '@playwright/test';

/**
 * Wrapper class around the preview panel in the Assignments page
 */
export class AssignmentPreview {
    page: Page

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Returns the dom node for the preview panel component
     * @returns {Locator}
     */
    get element(): Locator {
        return this.page.locator('.sd-preview-panel > .side-panel')
    }

    /**
     * Returns the dom node for the content section of the preview panel component
     * @returns {Locator}
     */
    get content(): Locator {
        return this.element.locator('.side-panel__content');
    }

    /**
     * Returns the dom node for the top tool section of the content panel component
     * @returns {Locator}
     */
    get topTools(): Locator {
        return this.element.locator('.side-panel__top-tools');
    }
}
