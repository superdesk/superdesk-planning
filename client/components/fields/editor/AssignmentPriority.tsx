import * as React from 'react';
import {connect} from 'react-redux';

import {IVocabularyItem} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

import {IEditorFieldProps} from '../../../interfaces';
import {getAssignmentPriorities} from '../../../selectors';
import {EditorFieldColouredValue} from './base/colouredValue';

interface IProps extends IEditorFieldProps {
    assignmentPriorities: Array<IVocabularyItem>;
    clearable?: boolean;
}

const mapStateToProps = (state) => ({
    assignmentPriorities: getAssignmentPriorities(state),
});

class EditorFieldAssignmentPriorityComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldColouredValue
                {...this.props}
                field={this.props.field ?? 'assignment_priority'}
                label={this.props.label ?? gettext('Assignment Priority')}
                options={this.props.assignmentPriorities}
                iconName="priority-label"
            />
        );
    }
}

export const EditorFieldAssignmentPriority = connect(mapStateToProps)(EditorFieldAssignmentPriorityComponent);
