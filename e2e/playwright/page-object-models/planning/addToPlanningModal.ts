import {Page, Locator} from '@playwright/test';
import {PlanningEditor} from './planning';
import {PlanningPreview} from './planningPreview';

export class AddToPlanningModal {
    page: Page;
    editor: PlanningEditor;
    preview: PlanningPreview;

    constructor(page: Page) {
        this.page = page;
        this.editor = new PlanningEditor(page);
        this.preview = new PlanningPreview(page);
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

    async cancel(): Promise<void> {
        await this.editor.closeButton.click();
        await this.editor.waitTillClosed();
        await this.dismiss();
    }

    async dismiss(): Promise<void> {
        await this.element.getByRole('button', {name: "Don't add", exact: true}).click();
        await this.waitTillClosed();
    }

    async previewPlanningItem(planningText: string): Promise<void> {
        await this.planningItem(planningText).click();
        await this.preview.waitTillOpen();
    }

    async addAsCoverage(planningText: string): Promise<void> {
        await this.selectPlanningItem(planningText);
        await this.editor.saveButton.click();
        await this.waitTillClosed();
    }

    async selectPlanningItem(planningText: string): Promise<void> {
        const planning = this.planningItem(planningText);

        await planning.hover();
        await planning.getByRole('button', {name: 'Add as coverage'}).click();
        await this.editor.waitTillOpen();
    }

    async addAsCoverageByDoubleClick(planningText: string): Promise<void> {
        await this.planningItem(planningText).dblclick();
        await this.editor.waitTillOpen();
        await this.editor.saveButton.click();
        await this.waitTillClosed();
    }
}
