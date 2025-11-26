import {Page} from '@playwright/test';

export {SubNavBar} from './subNavBar';
export {Popup} from './popup';
export {ActionMenu, getMenuItem} from './actionMenu';
export {Workqueue} from './workqueue';
export {Modal} from './modal';
export {UiFrameworkModal} from './uiFrameworkModal';

export const waitForPageLoad = {
    planning: async (page: Page) => {
        await page.locator('.icon-plus-large').waitFor({state: 'visible'});
    },
};
