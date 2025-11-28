import type {Locator} from '@playwright/test';

export const CLIENT_FORMAT = 'DD/MM/yy';

export async function clickAll(parent: Locator, selector: string): Promise<void> {
    const getCount = async () => (await parent.locator(selector).count());

    while (await getCount() > 0) {
        await parent
            .locator(selector)
            .first()
            .click();
    }
}
