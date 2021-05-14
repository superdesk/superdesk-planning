import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IPlanningNewsCoverageStatus, IEditorFieldProps} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';
import {newsCoverageStatus} from '../../../selectors/general';

interface IProps extends IEditorFieldProps {
    statuses: Array<IPlanningNewsCoverageStatus>;
    clearable?: boolean;
    defaultValue?: IPlanningNewsCoverageStatus;
}

const mapStateToProps = (state) => ({
    statuses: newsCoverageStatus(state),
});

export class EditorFieldNewsCoverageStatusComponent extends React.PureComponent<IProps> {
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
                field={props.field ?? 'news_coverage_status'}
                label={props.label ?? gettext('Coverage Status')}
                options={props.statuses}
                defaultValue={props.defaultValue ?? props.statuses[0]}
            />
        );
    }
}

export const EditorFieldNewsCoverageStatus = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldNewsCoverageStatusComponent);
