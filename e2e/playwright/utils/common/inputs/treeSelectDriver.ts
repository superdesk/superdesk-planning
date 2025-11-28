import {Input} from './input';
import {clickAll} from '../utils';

export class TreeSelectDriver extends Input {
    async type(value: string | Array<string>): Promise<void> {
        const values = Array.isArray(value) ? value : [value];

        await clickAll(this.element, '[data-test-id="clear-value"]');

        if (value === '' || values.length === 0) {
            return;
        }

        await this.element.locator('[data-test-id="open-popover"]').click();
        for (const val of values) {
            await this.page
                .locator('[data-test-id="tree-select-popover"] [data-test-id="option"]')
                .getByText(val, {exact: true})
                .click();
        }
    }
}
