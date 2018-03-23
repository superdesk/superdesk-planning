import {get, set} from 'lodash';

export const RequiredFieldsValidatorFactory = (fields = []) => (
    (values, props) => {
        // Add validators from the configured profile schema for the form
        if (get(props, 'formProfile.schema')) {
            Object.keys(props.formProfile.schema).forEach((f) => {
                if (fields.indexOf(f) === -1 && props.formProfile.schema[f].required) {
                    fields.push(f);
                }
            });
        }

        if (get(props, 'formProfile.planning.schema')) {
            let planningForm = props.formProfile.planning;

            Object.keys(planningForm.schema).forEach((f) => {
                if (fields.indexOf(f) === -1 && planningForm.schema[f].required) {
                    fields.push(f);
                }
            });
        }

        if (get(props, 'formProfile.coverage.schema')) {
            let coverageForm = props.formProfile.coverage;

            if (get(values, 'coverages.length')) {
                // iterate each coverage and push it's dynamic field name into fields for validation
                values.coverages.forEach((coverage, index) => {
                    Object.keys(coverageForm.schema).forEach((f) => {
                        let nthCoverageField = 'coverages[' + index + '].planning.' + f;

                        if (fields.indexOf(nthCoverageField) === -1 &&
                                coverageForm.schema[f].required) {
                            fields.push(nthCoverageField);
                        }
                    });
                });
            }
        }

        const errors = {};

        fields.forEach((field) => {
            if (!get(values, field) || get(values, field, 0).length === 0) {
                set(errors, field, 'Required');
            }
        });
        return errors;
    }
);

export default RequiredFieldsValidatorFactory;
