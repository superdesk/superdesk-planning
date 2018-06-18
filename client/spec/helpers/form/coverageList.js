import {get} from 'lodash';
import {Coverage} from './index';
import {waitAndClick, isCount} from '../utils';

export class CoverageList {
    constructor(form) {
        this.form = form;
        this.block = form.element(by.className('coverages__array'));
        this.dropdown = form.all(by.className('dropdown')).first();
        this.addButton = this.dropdown.element(by.className('dropdown__toggle'));
    }

    getValue(coverages) {
        let index = 0;

        return this.block.all(by.className('sd-collapse-box'))
            .map((collapseBox) => {
                const coverage = new Coverage(collapseBox, index);

                return coverage.getValue(coverages[index])
                    .then((coverage) => {
                        index += 1;
                        return coverage;
                    });
            });
    }

    setValue(values) {
        let index = 0;

        values.forEach((coverage) => {
            this.addCoverage(get(values, 'planning.g2_content_type') || 'text');
            this.setCoverageValues(coverage, index);
            index += 1;
        });
    }

    addCoverage(contentType) {
        waitAndClick(this.addButton);
        waitAndClick(this.dropdown.element(by.id(`coverage-menu-add-${contentType}`)));
    }

    setCoverageValues(values, index) {
        const coverageForms = this.block.all(by.className('sd-collapse-box__content'));

        browser.wait(() => isCount(coverageForms, index + 1), 7500);

        const coverage = new Coverage(coverageForms.get(index), index);

        coverage.setValue(values);
    }
}
