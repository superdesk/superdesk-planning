import PropTypes from 'prop-types';
import {get} from 'lodash';

export const description = ({item, fieldsProps}) => {
    const alternateFieldName = get(fieldsProps, 'location.alternateFieldName');

    return item.description_text || (alternateFieldName ? get(item, alternateFieldName, null) : null);
};

description.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    fieldsProps: PropTypes.object,
};