import {EventEditor} from './eventEditor';
import {SelectInput, NewCheckboxInput, UserSelectInput} from '../../common';

export class EmbeddedCoverageEditor {
    editor: EventEditor;

    constructor(editor: EventEditor) {
        this.editor = editor;
    }

    get element() {
        return this.editor.element;
    }

    getPlanningItem(index: number) {
        return this.element.find(`[data-test-id="editor--planning-item__${index}"]`);
    }

    getAddCoverageForm(index: number) {
        return this.getPlanningItem(index)
            .find('[data-test-id="editor--planning-item__add-coverage"]');
    }

    getCoverageEntry(planningIndex: number, coverageIndex: number): EmbeddedCoverage {
        return new EmbeddedCoverage(this, planningIndex, coverageIndex);
    }

    getRelatedCoverage(planningIndex: number, coverageIndex: number) {
        return this.getPlanningItem(planningIndex)
            .find('[data-test-id="editor--planning-item__coverages"]')
            .find(`[data-test-id="field-coverages[${coverageIndex}]"]`);
    }
}

export class EmbeddedCoverage {
    editor: EmbeddedCoverageEditor;
    planningIndex: number;
    coverageIndex: number;
    fields: {[key: string]: SelectInput | NewCheckboxInput | UserSelectInput};

    constructor(editor: EmbeddedCoverageEditor, planningIndex: number, coverageIndex: number) {
        this.editor = editor;
        this.planningIndex = planningIndex;
        this.coverageIndex = coverageIndex;

        const getParent = () => this.element;

        this.fields = {
            enabled: new NewCheckboxInput(getParent, '[data-test-id="enabled"]'),
            desk: new SelectInput(getParent, '[data-test-id="desk"] select'),
            user: new UserSelectInput(getParent, '[data-test-id="user"]'),
            status: new SelectInput(getParent, '[data-test-id="status"] select'),
        };
    }

    get cancelButton() {
        return this.editor.getAddCoverageForm(this.planningIndex)
            .find('[data-test-id="footer--cancel"]');
    }

    get addButton() {
        return this.editor.getAddCoverageForm(this.planningIndex)
            .find('[data-test-id="footer--add_coverage"]');
    }

    get element() {
        return this.editor.getAddCoverageForm(this.planningIndex)
            .find(`[data-test-id="coverage_${this.coverageIndex}"]`);
    }
}
