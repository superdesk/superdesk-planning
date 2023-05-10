import * as React from 'react';
import {superdeskApi} from '../../../superdeskApi';
import {ICoverageAssigned, IEditorFieldProps} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';

interface IProps extends IEditorFieldProps {
    contentTypes: Array<ICoverageAssigned>;
    clearable?: boolean; // defaults to true
    defaultValue?: ICoverageAssigned; // defaults to {}
    valueAsString?: boolean;
}

export class EditorFieldAssignedCoverageComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        const coverageOption = [
            {qcode: 'null', name: 'No Coverage Assigned'},
            {qcode: 'some', name: 'Some Coverages Assigned'},
            {qcode: 'all', name: 'All Coverages Assigned'}
        ];
        const {
            refNode,
            ...props
        } = this.props;

        return (
            <EditorFieldSelect
                ref={refNode}
                {...props}
                field={props.field ?? 'coverage_assignment_status'}
                label={gettext('Coverage Assignment Status')}
                options={coverageOption}
                labelField="name"
                clearable={true}
                defaultValue={props.defaultValue ?? {}}
                valueAsString={true}
            />
        );
    }
}

