import BaseEditor from './baseEditor';
import Form from '../form';
import ActionMenu from '../ui/actionMenu';

export default class CoverageEditor extends BaseEditor {
    constructor(parentEditor, index) {
        super();

        this.parentEditor = parentEditor;
        this.index = index;

        const prefix = `coverages[${this.index}].`;

        this.fields = {
            content_type: new Form.SelectInput(this, `select[name="${prefix}planning.g2_content_type"]`),
            genre: new Form.SelectInput(this, `select[name="${prefix}planning.genre"]`),
            slugline: new Form.Input(this, `input[name="${prefix}planning.slugline"]`),
            ednote: new Form.Input(this, `textarea[name="${prefix}planning.ednote"]`),
            internal_note: new Form.Input(this, `textarea[name="${prefix}planning.internal_note"]`),
            news_coverage_status: new Form.SelectInput(this, `select[name="${prefix}news_coverage_status"]`),
            scheduled: {
                date: new Form.Input(this, `input[name="${prefix}planning.scheduled.date"]`),
                time: new Form.Input(this, `input[name="${prefix}planning._scheduledTime"]`),
            },
        };
    }

    get element() {
        return this.parentEditor.element
            .find('.coverages__array')
            .find('.sd-collapse-box')
            .eq(this.index);
    }

    get reassignButton() {
        return this.element.contains('Reassign');
    }

    get removeButton() {
        return this.element.contains('Remove');
    }

    get editAssignmentButton() {
        return this.element.find('#editAssignment');
    }

    get submitAssignmentButton() {
        return this.element.find('#submitAssignment');
    }

    get actionMenu() {
        return new ActionMenu(
            () => this.element
        );
    }

    clickAction(label) {
        this.actionMenu
            .open()
            .getAction(label)
            .click();
    }
}
