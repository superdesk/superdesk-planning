import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';

import {CoverageArrayInput} from '../../Coverages';
import {getFileDownloadURL} from '../../../utils';
import {IPropsEditorFieldCoverages} from './coverages.interface';

export class EditorFieldCoverages extends React.PureComponent<IPropsEditorFieldCoverages> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'coverages';
        const value = get(this.props.item, field, this.props.defaultValue);

        return (
            <CoverageArrayInput
                {...this.props}
                testId="field-coverages"
                field={this.props.field ?? 'coverages'}
                value={value}
                addButtonText={this.props.addButtonText ?? gettext('Add a coverage')}
                createUploadLink={getFileDownloadURL}
            />
        );
    }
}
