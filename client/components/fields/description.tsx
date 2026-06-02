import * as React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {PlainText} from '../UI/PlainText';

const stylesForEllipsis: React.CSSProperties = {
    flexShrink: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};


export const description = ({item, fieldsProps}) => {
    const alternateFieldName = get(fieldsProps, 'location.alternateFieldName');
    const text = item.description_text || (alternateFieldName ? get(item, alternateFieldName, '') : '');

    return (
        <span className="sd-list-item__description" style={stylesForEllipsis}>
            <PlainText text={text} />
        </span>
    );
};

description.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    fieldsProps: PropTypes.object,
};
