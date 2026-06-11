import {Locator} from '@playwright/test';

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
