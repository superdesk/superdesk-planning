import {Locator, expect} from '@playwright/test';
import {Modal} from '../../../utils/common';

type IFooterButtonLabels = 'Close' | 'Cancel' | 'Save' | 'Post' | 'Update';
interface IExpectListEntries {
    available: Array<string>;
    selected: Array<string>;
    removed: Array<string> | null;
}

export class FeaturedModal extends Modal {
    async waitTillLoadingFinished(): Promise<void> {
        await this.element
            .locator('.loading-indicator')
            .waitFor({state: 'detached'});
    }

    get subnav(): Locator {
        return this.element.getByTestId('featured-modal--subnav');
    }

    get currentDate(): Locator {
        return this.subnav.getByTestId('featured-modal--current-date');
    }

    async expectFooterButtons(buttons: Array<IFooterButtonLabels>): Promise<void> {
        const buttonLabels: Array<IFooterButtonLabels> = ['Close', 'Cancel', 'Save', 'Post', 'Update'];

        for (const label of buttonLabels) {
            if (buttons.indexOf(label) >= 0) {
                await expect(this.footerButton(label)).toBeVisible();
            } else {
                await expect(this.footerButton(label)).not.toBeAttached();
            }
        }
    }

    footerButton(label: IFooterButtonLabels): Locator {
        return this.footer.getByRole('button', {name: label, exact: true});
    }

    async expectListEntries(lists: IExpectListEntries): Promise<void> {
        for (const name of Object.keys(lists) as Array<keyof IExpectListEntries>) {
            const list = lists[name];

            if (list === null) {
                await expect(this.getList(name)).not.toBeAttached();
                continue;
            }

            await expect(this.getList(name).locator('li')).toHaveCount(list.length);

            for (let index = 0; index < list.length; index++) {
                await expect(
                    this.getList(name).locator('li')
                        .nth(index)
                ).toContainText(list[index]);
            }
        }
    }

    async expectListItemHighlighted(listName: keyof IExpectListEntries, index: number): Promise<void> {
        await expect(
            this.getList(listName)
                .locator('li')
                .nth(index)
        ).toHaveClass(/sd-list-item--selected/);
    }

    getList(name: keyof IExpectListEntries): Locator {
        return this.element.getByTestId(`list-${name}`);
    }

    async addItemToSelected(index: number): Promise<void> {
        await this.getList('available')
            .locator('li')
            .nth(index)
            .getByRole('button', {name: 'Add to Feature Stories', exact: true})
            .click();
    }
}
