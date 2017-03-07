import { merge } from 'lodash'

export const ChainValidators = (validators) => (
    (values) => {
        const errors = {}
        validators.forEach((v) => {
            const e = v(values)
            merge(errors, e)
        })
        return errors
    }
)

export default ChainValidators
