import * as React from 'react';
import {superdeskApi} from '../../../superdeskApi';
import {IG2ContentType, IEditorFieldProps} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';

interface IProps extends IEditorFieldProps {
    clearable?: boolean; // defaults to true
    valueAsString?: boolean;
}

export class EditorFieldAssignedCoverageComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        const coverageOption = [
            {id: 'null', name: 'No Coverage Assigned'},
            {id: 'some', name: 'Some Coverages Assigned'},
            {id: 'All', name: 'All Coverages Assigned'}
        ];

        return (
            <EditorFieldSelect
                field={'Coverage Assignment Status'}
                label={gettext('Coverage Assignment Status')}
                options={coverageOption}
                labelField="name"
                clearable={true}
                defaultValue={''}
                valueAsString= {true}
            />
        );
    }
}

