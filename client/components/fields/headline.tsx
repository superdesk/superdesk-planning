import PropTypes from 'prop-types';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';
import {stringUtils} from '../../utils';

export const headline = ({item, language}: IFieldsProps) => item.headline != null
    ? stringUtils.convertHtmlToPlainText(
        getTranslatedValue(language, item, 'headline') || item.headline,
    )
    : null;

headline.propTypes = {
    item: PropTypes.shape({
        headline: PropTypes.string,
    }).isRequired,
    language: PropTypes.string,
};
