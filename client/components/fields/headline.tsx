import PropTypes from 'prop-types';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';

export const headline = ({item, filterLanguage}: IFieldsProps) => getTranslatedValue(
    filterLanguage, item, 'headline') || item.headline || null;

headline.propTypes = {
    item: PropTypes.shape({
        headline: PropTypes.string,
    }).isRequired,
    filterLanguage: PropTypes.string,
};