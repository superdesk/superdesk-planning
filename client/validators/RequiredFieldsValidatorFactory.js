import { get, set } from 'lodash'

export const RequiredFieldsValidatorFactory = (fields) => (
    values => {
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
