import * as React from 'react';
import {superdeskApi} from '../../../superdeskApi';
import {ICoverageAssigned, IEditorFieldProps, IPlanningConfig} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';
import * as config from 'appConfig';
const appConfig = config.appConfig as IPlanningConfig;

interface IProps extends IEditorFieldProps {
    contentTypes: Array<ICoverageAssigned>;
    clearable?: boolean; // defaults to true
    defaultValue?: ICoverageAssigned; // defaults to {}
    valueAsString?: boolean;
}

export class EditorFieldAssignedCoverageComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        if (appConfig.planning_auto_assign_to_workflow) {
            return null;
        }

        const coverageOption = [
            {qcode: 'null', name: gettext('No Coverage Assigned')},
            {qcode: 'some', name: gettext('Some Coverages Assigned')},
            {qcode: 'all', name: gettext('All Coverages Assigned')}
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

