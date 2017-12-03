import {SelectField} from './SelectField';
import {connect} from 'react-redux';

const mapStateToProps = (state) => ({
    clearable: true,
    options: state.genres.map((genre) => (
        {
            key: genre.qcode,
            label: genre.name,
            value: genre,
        }
    )),

    getOptionFromValue: (value, options) => options.find(
        (option) => option.key === value.qcode
    ),
});

export const GenreField = connect(mapStateToProps)(SelectField);
