import {ColoredValueSelectField} from './ColoredValueSelectField/';
import {connect} from 'react-redux';

const mapStateToProps = (state, ownProps) => ({
    options: (state.urgency.urgency || []).map((u) => (
        {
            label: u.name,
            value: u,
        }
    )),
    value: ownProps.input.value ? {label: ownProps.input.value} : null,
    label: state.urgency.label,
    iconName: 'urgency-label',
});

export const UrgencyField = connect(mapStateToProps)(ColoredValueSelectField);
