import * as React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {PlainText} from '../UI/PlainText';

export const description = ({item, fieldsProps}) => {
    const alternateFieldName = get(fieldsProps, 'location.alternateFieldName');
    const text = item.description_text || (alternateFieldName ? get(item, alternateFieldName, '') : '');

    return <PlainText text={text} />;
};

description.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    fieldsProps: PropTypes.object,
};
