import {isNil, get} from 'lodash';

const isLockedByUser = (item, userId, action) => (
    !isNil(get(item, 'lock_session')) &&
        get(item, 'lock_user') === userId &&
        (!action || get(item, 'lock_action') === action)
);

// eslint-disable-next-line consistent-this
const self = {
    isLockedByUser,
};

export default self;
