import PropTypes from 'prop-types';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';

export const name = ({item, language}: IFieldsProps) => getTranslatedValue(language, item, 'name') ||
item.name || null;

name.propTypes = {
    item: PropTypes.shape({
        name: PropTypes.string,
    }).isRequired,
    language: PropTypes.string,
};
