import { get, set } from 'lodash'

export const RequiredFieldsValidatorFactory = (fields) => (
    (values, props) => {
        // Add validators from the configured profile schema for the form
        if (get(props, 'formProfile.schema')) {
            Object.keys(props.formProfile.schema).forEach((f) => {
                if (fields.indexOf(f) === -1 && props.formProfile.schema[f].required) {
                    fields.push(f)
                }
            })
        }

        const errors = {}
        fields.forEach((field) => {
            if (!get(values, field)) {
                set(errors, field, 'Required')
            }
        })
        return errors
    }
)

export default RequiredFieldsValidatorFactory
