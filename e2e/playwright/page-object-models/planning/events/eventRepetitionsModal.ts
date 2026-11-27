import {expect} from '@playwright/test';
import {Modal} from '../../../utils/common';

export class EventRepetitionsModal extends Modal {
    async updateCount(count: number): Promise<void> {
        await this.waitTillOpen();
        await this.shouldContainTitle('Update Repetitions of the Series');
        const input = this.element.getByTestId('dates.recurring_rule.count');

        await input.fill(count.toString());
        await input.press('Tab');
        const save = this.getFooterButton('Update Repetitions');

        await expect(save).toBeEnabled();
        await save.click();
        await this.waitTillClosed();
    }
}
