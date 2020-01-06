import BaseEditor from './baseEditor';
import CoverageEditor from './coverageEditor';
import Form from '../form';
import Popup from '../ui/popup';

export default class PlanningEditor extends BaseEditor {
    constructor() {
        super('.icon-calendar.icon--2x.icon--light-blue');
        this.fields = {
            name: new Form.Input(this, 'input[name="name"]'),
            slugline: new Form.Input(this, 'input[name="slugline"]'),
            headline: new Form.Input(this, 'input[name="headline"]'),
            planning_date: {
                date: new Form.Input(this, 'input[name="planning_date.date"]'),
                time: new Form.Input(this, 'input[name="planning_date.time"]'),
            },
            description_text: new Form.Input(this, 'textarea[name="description_text"]'),
            internal_note: new Form.Input(this, 'textarea[name="internal_note"]'),
            ednote: new Form.Input(this, 'textarea[name="ednote"]'),
            anpa_category: new Form.SelectMetaTerms(this, '#form-row-anpa_category'),
            subject: new Form.SelectMetaTerms(this, '#form-row-subject'),
            urgency: new Form.UrgencyInput(this, '#form-row-urgency'),
            flags: {
                marked_for_not_publication: new Form.ToggleInput(
                    this,
                    'button[name="flags.marked_for_not_publication"]'
                ),
            },
        };
    }

    get coveragesContainer() {
        return this.element.find('.coverages__array');
    }

    get addCoverageButton() {
        return this.coveragesContainer.find('.sd-create-btn');
    }

    addCoverage(coverageType) {
        cy.log('Editor.Planning.addCoverage');
        const popup = new Popup();

        this.addCoverageButton.click();
        popup.waitTillOpen();
        popup.element
            .contains(coverageType)
            .click();
        popup.waitTillClosed();
    }

    getCoverageEditor(index) {
        return new CoverageEditor(this, index);
    }

    typeCoverages(coverages) {
        cy.log('Editor.Planning.typeCoverages');
        let editor;

        coverages.forEach(
            (coverage, index) => {
                this.addCoverage(coverage.content_type);
                editor = this.getCoverageEditor(index);
                editor.type(coverage);
            }
        );
    }

    expectCoverages(coverages) {
        cy.log('Editor.Planning.expectCoverages');
        let editor;

        coverages.forEach(
            (coverage, index) => {
                editor = this.getCoverageEditor(index);
                editor.expect(coverage);
            }
        );
    }
}
