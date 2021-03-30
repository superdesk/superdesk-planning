import PropTypes from 'prop-types';

export const headline = ({item}) => item.headline || null;

headline.propTypes = {
    item: PropTypes.shape({
        headline: PropTypes.string,
    }).isRequired,
};