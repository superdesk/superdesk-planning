import {ColoredValueSelectField} from './ColoredValueSelectField/';
import {getAssignmentPriority} from '../../utils';
import {connect} from 'react-redux';

const mapStateToProps = (state, ownProps) => {
    let valueObject;

    if (ownProps.input.value) {
        valueObject = getAssignmentPriority(ownProps.input.value,
            state.vocabularies.assignment_priority || []);
        valueObject = {
            label: valueObject.name,
            value: {...valueObject},
        };
    }

    return {
        options: (state.vocabularies.assignment_priority || []).map((u) => (
            {
                label: u.name,
                value: u,
            }
        )),
        value: valueObject,
        label: ownProps.label,
        iconName: 'priority-label',
        clearable: false,
    };
};

export const AssignmentPriorityField = connect(mapStateToProps)(ColoredValueSelectField);
