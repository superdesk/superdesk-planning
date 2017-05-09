import { get, set } from 'lodash'

export const MaxLengthValidatorFactory = (fields) => (
    values => {
        const errors = {}
        for (var field in fields) {
            if (fields.hasOwnProperty(field)) {
                if (get(values[field], 'length', 0) > fields[field]) {
                    set(errors, field, `Value is to long. Max is ${fields[field]}`)
                }
            }
        }

        return errors
    }
)

export default MaxLengthValidatorFactory
