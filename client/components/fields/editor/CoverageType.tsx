import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IG2ContentType, IEditorFieldProps} from '../../../interfaces';
import {contentTypes} from '../../../selectors/general';
import {EditorFieldSelect} from './base/select';

interface IProps extends IEditorFieldProps {
    contentTypes: Array<IG2ContentType>;
}

const mapStateToProps = (state) => ({
    contentTypes: contentTypes(state),
});

export class EditorFieldCoverageTypeComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldSelect
                field={this.props.field ?? 'g2_content_type'}
                label={this.props.label ?? gettext('Coverage Type')}
                options={this.props.contentTypes}
                labelField="name"
                clearable={true}
                defaultValue={{}}
                {...this.props}
            />
        );
    }
}

export const EditorFieldCoverageType = connect(mapStateToProps)(EditorFieldCoverageTypeComponent);
