import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IUrgency, IEditorFieldProps} from '../../../interfaces';
import {EditorFieldColouredValue} from './base/colouredValue';
import {getUrgencies} from '../../../selectors';

interface IProps extends IEditorFieldProps {
    urgencies: Array<IUrgency>;
}

const mapStateToProps = (state) => ({
    urgencies: getUrgencies(state),
});

export class EditorFieldUrgencyComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldColouredValue
                field={this.props.field ?? 'urgency'}
                label={this.props.label ?? gettext('Urgency')}
                options={this.props.urgencies}
                iconName="urgency-label"
                clearable={true}
                {...this.props}
            />
        );
    }
}

export const EditorFieldUrgency = connect(mapStateToProps)(EditorFieldUrgencyComponent);
