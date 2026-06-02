import {Input} from './input';
import {clickAll} from '../utils';

export class TreeSelectDriver extends Input {
    async type(value: string | Array<string>): Promise<void> {
        const values = Array.isArray(value) ? value : [value];

        await clickAll(this.element, 'clear-value', true);

        if (value === '' || values.length === 0) {
            return;
        }

        await this.element.getByTestId('open-popover').click();
        for (const val of values) {
            await this.page
                .getByTestId('tree-select-popover')
                .getByTestId('option')
                .getByText(val, {exact: true})
                .click();
        }
    }
}
