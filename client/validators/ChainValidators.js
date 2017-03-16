import { merge, reduce } from 'lodash'

export const ChainValidators = (validators) => (
    (values) => {
        const errors = reduce(validators, (result, v) => (
            merge(result, v(values))
        ), {})
        return errors
    }
)

export default ChainValidators
