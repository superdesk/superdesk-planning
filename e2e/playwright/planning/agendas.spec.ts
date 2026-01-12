import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar, addItems, UiFrameworkModal} from '../utils/common';
import {AGENDAS} from '../utils/fixtures/planning';

test.describe('Planning.Agendas: manage agendas', () => {
    let subnav: SubNavBar;
    let modal: UiFrameworkModal;

    test.beforeEach(async ({page}) => {
        subnav = new SubNavBar(page);
        modal = new UiFrameworkModal(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'agenda', [AGENDAS.sports, AGENDAS.politics]);
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can show agendas in manage modal', async () => {
        await subnav.menuBtn.click();
        await subnav.menu
            .getByText('Manage agendas')
            .click();

        await modal.waitTillOpen();
        await expect(
            modal.element
                .getByTestId('list-page--items')
                .locator('.sd-list-item')
        ).toHaveCount(2);

        await expect(modal.element.locator('.sd-list-item__border--active')).toHaveCount(2);

        await modal.getFooterButton('Close')
            .click();
        await modal.waitTillClosed();
    });

    test('can edit an agenda', async ({page}) => {
        await subnav.menuBtn.click();
        await subnav.menu
            .getByText('Manage agendas')
            .click();

        await modal.waitTillOpen();

        await modal.element
            .getByTestId('list-page--items')
            .locator('.sd-list-item')
            .first()
            .hover();

        await modal.element
            .getByTestId('list-page--items')
            .locator('.sd-list-item')
            .first()
            .locator('.icon-pencil')
            .click();

        await expect(modal.element.getByTestId('gform-input--name')).toBeVisible();
        await expect(modal.element.getByTestId('gform-input--name')).toHaveValue('Sports');

        await modal.element.getByTestId('gform-input--name').clear();
        await modal.element.getByTestId('gform-input--name').fill('New Sports Name');

        await modal.element
            .getByTestId('list-page--view-edit')
            .getByTestId('item-view-edit--save')
            .click();

        await page.waitForTimeout(1000);

        await expect(
            modal.element
                .getByTestId('list-page--items')
                .locator('.sd-list-item')
                .first()
        ).toContainText('New Sports Name');

        await modal.getFooterButton('Close').click();
    });

    test('validates required fields when editing agenda', async ({page}) => {
        await subnav.menuBtn.click();
        await subnav.menu
            .getByText('Manage agendas')
            .click();

        await modal.waitTillOpen();

        await modal.element
            .getByTestId('list-page--items')
            .locator('.sd-list-item')
            .first()
            .hover();

        await modal.element
            .getByTestId('list-page--items')
            .locator('.sd-list-item')
            .first()
            .locator('.icon-pencil')
            .click();

        await modal.element
            .getByTestId('gform-input--name')
            .clear();

        // Field is required
        await modal.element
            .getByTestId('list-page--view-edit')
            .getByTestId('item-view-edit--save')
            .click();

        await expect(
            modal.element
                .getByTestId('list-page--view-edit')
                .locator('.sd-input__message')
        ).toContainText('Field is required');

        await modal.element
            .getByTestId('gform-input--name')
            .fill('Valid Name');

        await expect(
            modal.element
                .getByTestId('list-page--view-edit')
                .getByTestId('item-view-edit--save')
        ).toBeEnabled();

        await modal.element
            .getByRole('button', {name: 'Cancel'})
            .click();

        await page.locator('.p-dialog-footer')
            .getByRole('button', {name: 'Don\'t save'})
            .click();

        await modal.getFooterButton('Close').click();
    });

    test('can create a new agenda', async ({page}) => {
        await subnav.menuBtn.click();
        await subnav.menu
            .getByText('Manage agendas')
            .click();

        await modal.waitTillOpen();

        await expect(
            modal.element.getByTestId('list-page--items').locator('.sd-list-item')
        ).toHaveCount(2);

        await modal.element
            .getByTestId('list-page--add-item')
            .click();

        await modal.element
            .getByTestId('gform-input--name')
            .fill('New Test Agenda');

        await modal.element
            .getByTestId('item-view-edit--save')
            .click();

        await page.waitForTimeout(1000);

        await expect(
            modal.element
                .getByTestId('list-page--items')
                .locator('.sd-list-item')
        ).toHaveCount(3);

        await expect(
            modal.element
                .getByTestId('list-page--items')
                .locator('.sd-list-item')
                .last()
        ).toContainText('New Test Agenda');

        await modal.getFooterButton('Close').click();
    });
});
