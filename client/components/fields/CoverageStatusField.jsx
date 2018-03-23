import {SelectField} from './SelectField';
import {connect} from 'react-redux';
import {get} from 'lodash';

const mapStateToProps = (state) => ({
    options: get(state, 'vocabularies.newscoveragestatus', []).map((state) => (
        {
            key: state.qcode,
            label: state.label,
            value: state,
        }
    )),

    getOptionFromValue: (value, options) => options.find(
        (option) => option.key === value.qcode
    ),
});

export const CoverageStatusField = connect(mapStateToProps)(SelectField);
