import PropTypes from 'prop-types';

export const description = ({item}) => item.description_text || null;

description.propTypes = {
    item: PropTypes.shape({
        description_text: PropTypes.string,
    }).isRequired,
};