import {Page, Locator} from '@playwright/test';
import {PlanningEditor} from './planning';

export class AddToPlanningModal {
    page: Page;
    editor: PlanningEditor;

    constructor(page: Page) {
        this.page = page;
        this.editor = new PlanningEditor(page);
    }

    get element(): Locator {
        return this.page.getByRole('dialog').filter({hasText: 'Add article to Planning'});
    }

    planningItem(text: string): Locator {
        return this.element.getByRole('option')
            .filter({hasText: text})
            .first();
    }

    async waitTillOpen(): Promise<void> {
        await this.element.waitFor({state: 'visible'});
    }

    async waitTillClosed(): Promise<void> {
        await this.element.waitFor({state: 'hidden'});
    }

    async addAsCoverage(planningText: string): Promise<void> {
        const planning = this.planningItem(planningText);

        await planning.hover();
        await planning.getByRole('button', {name: 'Add as coverage'}).click();
        await this.editor.waitTillOpen();
        await this.editor.saveButton.click();
        await this.waitTillClosed();
    }

    async addAsCoverageByDoubleClick(planningText: string): Promise<void> {
        await this.planningItem(planningText).dblclick();
        await this.editor.waitTillOpen();
        await this.editor.saveButton.click();
        await this.waitTillClosed();
    }
}
