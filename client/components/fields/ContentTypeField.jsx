import {SelectField} from './SelectField';
import {connect} from 'react-redux';
import {get} from 'lodash';

const mapStateToProps = (state) => ({
    options: get(state, 'vocabularies.g2_content_type', []).map((state) => (
        {
            key: state.qcode,
            label: state.name,
            value: state.qcode,
        }
    )),

    getOptionFromValue: (value, options) => options.find(
        (option) => option.key === value
    ),

    clearable: true,
});

export const ContentTypeField = connect(mapStateToProps)(SelectField);
