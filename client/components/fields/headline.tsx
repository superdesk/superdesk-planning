import PropTypes from 'prop-types';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';

export const headline = ({item, language}: IFieldsProps) => getTranslatedValue(
    language, item, 'headline') || item.headline || null;

headline.propTypes = {
    item: PropTypes.shape({
        headline: PropTypes.string,
    }).isRequired,
    filterLanguage: PropTypes.string,
};
