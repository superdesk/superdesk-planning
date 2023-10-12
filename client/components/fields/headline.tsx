import PropTypes from 'prop-types';
import {getTranslatedValue} from '.';

export const headline = ({item, filterLanguage}) => getTranslatedValue(filterLanguage, item, 'headline') ||
item.headline || null;

headline.propTypes = {
    item: PropTypes.shape({
        headline: PropTypes.string,
    }).isRequired,
    filterLanguage: PropTypes.string,
};