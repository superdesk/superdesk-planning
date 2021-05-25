import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IEventOccurStatus, IEditorFieldProps} from '../../../interfaces';
import {eventOccurStatuses} from '../../../selectors/vocabs';
import {EditorFieldSelect} from './base/select';

interface IProps extends IEditorFieldProps {
    statuses: Array<IEventOccurStatus>;
}

const mapStateToProps = (state) => ({
    statuses: eventOccurStatuses(state),
});

class EditorFieldEventOccurenceStatusComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            refNode,
            ...props
        } = this.props;

        return (
            <EditorFieldSelect
                ref={refNode}
                {...props}
                field={props.field ?? 'occur_status'}
                label={props.label ?? gettext('Occurrence Status')}
                options={props.statuses}
                defaultValue={null}
            />
        );
    }
}

export const EditorFieldEventOccurenceStatus = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldEventOccurenceStatusComponent);
