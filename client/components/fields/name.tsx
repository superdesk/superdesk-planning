import PropTypes from 'prop-types';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';

export const name = ({item, filterLanguage}: IFieldsProps) => getTranslatedValue(filterLanguage, item, 'name') ||
item.name || null;

name.propTypes = {
    item: PropTypes.shape({
        name: PropTypes.string,
    }).isRequired,
    filterLanguage: PropTypes.string,
};