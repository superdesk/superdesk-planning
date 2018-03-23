import {merge, reduce} from 'lodash';

export const ChainValidators = (validators) => (
    (values, props) => {
        const errors = reduce(validators, (result, v) => (
            merge(result, v(values, props))
        ), {});

        return errors;
    }
);

export default ChainValidators;
