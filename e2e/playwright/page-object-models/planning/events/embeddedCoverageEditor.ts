import {expect} from '@playwright/test';
import type {Locator, Page, Response} from '@playwright/test';

import {EventEditor} from './eventEditor';
import {SelectInput, NewCheckboxInput, CoverageUserSelectInput} from '../../../utils/common';

export class EmbeddedCoverageEditor {
    editor: EventEditor;

    constructor(editor: EventEditor) {
        this.editor = editor;
    }

    get element(): Locator {
        return this.editor.element;
    }

    getPlanningItem(index: number): Locator {
        return this.element.getByTestId(`editor--planning-item__${index}`);
    }

    // An embedded planning renders collapsed with its fields present but not
    // interactable; expand it before touching any field.
    async expand(index: number): Promise<void> {
        const showMore = this.getPlanningItem(index).getByRole('button', {name: 'Show more'});

        if (await showMore.isVisible().catch(() => false)) {
            await showMore.click();
        }
    }

    slugline(index: number): Locator {
        return this.getPlanningItem(index).getByTestId('editor3').locator('[contenteditable="true"]').first();
    }

    async appendToSlugline(index: number, text: string): Promise<void> {
        await this.expand(index);

        const field = this.slugline(index);

        await field.scrollIntoViewIfNeeded();
        await field.click();
        await field.page().keyboard.press('End');
        await field.page().keyboard.type(text);
    }

    async save(index: number): Promise<void> {
        const planning = this.getPlanningItem(index);

        await planning.getByRole('button', {name: 'Save', exact: true}).first().click();

        // Done once no enabled Save button remains: the first save persists a temporary
        // item and remounts the card collapsed (button gone), later saves just grey it out.
        await expect(planning.locator('button:enabled', {hasText: 'Save'})).toHaveCount(0, {timeout: 20000});
    }

    // Resolves once an autosave request of the given method has completed
    // successfully, so callers can reload without racing the pending write.
    waitForAutosaved(page: Page, method: 'POST' | 'PATCH'): Promise<Response> {
        return page.waitForResponse((res) =>
            res.url().includes('/api/planning_autosave') &&
            res.request().method() === method &&
            res.status() < 400);
    }

    getAddCoverageForm(index: number): Locator {
        return this.getPlanningItem(index)
            .getByTestId('editor--planning-item__add-coverage');
    }

    getCoverageEntry(planningIndex: number, coverageIndex: number): EmbeddedCoverage {
        return new EmbeddedCoverage(this, planningIndex, coverageIndex);
    }

    getRelatedCoverage(planningIndex: number, coverageIndex: number) {
        return this.getPlanningItem(planningIndex)
            .getByTestId('editor--planning-item__coverages')
            .getByTestId(`field-coverages[${coverageIndex}]`);
    }
}

export class EmbeddedCoverage {
    editor: EmbeddedCoverageEditor;
    planningIndex: number;
    coverageIndex: number;
    fields: {[key: string]: SelectInput | NewCheckboxInput | CoverageUserSelectInput};

    constructor(editor: EmbeddedCoverageEditor, planningIndex: number, coverageIndex: number) {
        this.editor = editor;
        this.planningIndex = planningIndex;
        this.coverageIndex = coverageIndex;

        const getParent = () => this.element;

        this.fields = {
            enabled: new NewCheckboxInput(editor.editor.page, getParent, '[data-test-id="enabled"]'),
            desk: new SelectInput(editor.editor.page, getParent, '[data-test-id="desk"] select'),
            user: new CoverageUserSelectInput(editor.editor.page, getParent, '[data-test-id="user"]'),
            status: new SelectInput(editor.editor.page, getParent, '[data-test-id="status"] select'),
        };
    }

    get cancelButton(): Locator {
        return this.editor.getAddCoverageForm(this.planningIndex)
            .getByTestId('footer--cancel');
    }

    get addButton(): Locator {
        return this.editor.getAddCoverageForm(this.planningIndex)
            .getByTestId('footer--add_coverage');
    }

    get element(): Locator {
        return this.editor.getAddCoverageForm(this.planningIndex)
            .getByTestId(`coverage_${this.coverageIndex}`);
    }
}
