import {get, set, reduce, merge} from 'lodash';

export const MaxLengthValidatorFactory = (fields = {}) => (
    (values, props) => {
        let _fields;
        let _result;

        // Add validators from the configured profile schema for the form
        if (get(props, 'formProfile.schema')) {
            // get all fields from schema where maxlength attribute defined
            _result = reduce(props.formProfile.schema, (result, value, key) => {
                if (value.maxlength) {
                    result[key] = value.maxlength;
                }

                return result;
            }, {});

            merge(fields, _result);
        }

        if (get(props, 'formProfile.planning.schema')) {
            let planningForm = props.formProfile.planning;
            // get all fields from schema where maxlength attribute defined

            _result = reduce(planningForm.schema, (result, value, key) => {
                if (value.maxlength) {
                    result[key] = value.maxlength;
                }

                return result;
            }, {});

            merge(fields, _result);
        }

        if (get(props, 'formProfile.coverage.schema')) {
            let coverageForm = props.formProfile.coverage;

            if (values.coverages.length) {
                // get all fields from schema where maxlength attribute defined
                _fields = reduce(coverageForm.schema, (result, value, key) => {
                    if (value.maxlength) {
                        result[key] = value.maxlength;
                    }

                    return result;
                }, {});
                // apply maxlength for each coverage's fields
                values.coverages.forEach((coverage, index) => {
                    _result = reduce(_fields, (result, value, key) => {
                        let nthCoverageField = 'coverages[' + index + '].planning.' + key;

                        result[nthCoverageField] = value;
                        return result;
                    }, {});

                    merge(fields, _result);
                });
            }
        }

        const errors = {};

        for (var field in fields) {
            if (fields.hasOwnProperty(field)) {
                if (get(values, field, 0).length > fields[field]) {
                    set(errors, field, `Value is too long. Max is ${fields[field]} characters`);
                }
            }
        }

        return errors;
    }
);

export default MaxLengthValidatorFactory;
