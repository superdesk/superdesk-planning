import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IG2ContentType, IEditorFieldProps} from '../../../interfaces';
import {contentTypes} from '../../../selectors/general';
import {EditorFieldSelect} from './base/select';

interface IProps extends IEditorFieldProps {
    contentTypes: Array<IG2ContentType>;
    clearable?: boolean; // defaults to true
    defaultValue?: IG2ContentType; // defaults to {}
    valueAsString?: boolean;
}

const mapStateToProps = (state) => ({
    contentTypes: contentTypes(state),
});

export class EditorFieldCoverageTypeComponent extends React.PureComponent<IProps> {
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
                field={props.field ?? 'g2_content_type'}
                label={props.label ?? gettext('Coverage Type')}
                options={props.contentTypes}
                labelField="name"
                clearable={props.clearable ?? true}
                defaultValue={props.defaultValue ?? {}}
            />
        );
    }
}

export const EditorFieldCoverageType = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldCoverageTypeComponent);
