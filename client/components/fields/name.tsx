import PropTypes from 'prop-types';

export const name = ({item}) => item.name || null;

name.propTypes = {
    item: PropTypes.shape({
        name: PropTypes.string,
    }).isRequired,
};