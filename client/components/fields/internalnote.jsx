import React from 'react';
import PropTypes from 'prop-types';

import {InternalNoteLabel} from '../InternalNoteLabel';

export const internalnote = ({item}) => (
    <InternalNoteLabel item={item} />
);

internalnote.propTypes = {
    item: PropTypes.shape({}).isRequired,
};
