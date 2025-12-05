import type {Locator} from '@playwright/test';

export const CLIENT_FORMAT = 'DD/MM/yy';

export async function clickAll(parent: Locator, selector: string, useTestId: boolean = false): Promise<void> {
    const getElement = useTestId ? parent.getByTestId(selector) : parent.locator(selector);

    while (await getElement.count() > 0) {
        await getElement.first().click();
    }
}
