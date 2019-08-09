import PropTypes from 'prop-types';
import {get} from 'lodash';

export const description = ({item, alternateFieldName}) =>
    item.description_text || (alternateFieldName ? get(item, alternateFieldName, null) : null);

description.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
    alternateFieldName: PropTypes.string,
};