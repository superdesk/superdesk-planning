import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IDesk} from 'superdesk-api';
import {IEditorFieldProps, IContentTemplate} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';
import {templates as getTemplates} from '../../../selectors/general';

interface IProps extends IEditorFieldProps {
    templates: Array<IContentTemplate>;
    desk?: IDesk;
    clearable?: boolean;
}

const mapStatToProps = (state) => ({
    templates: getTemplates(state),
});

export class EditorFieldContentTemplateComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const deskId = this.props.desk?._id;
        const templates = deskId == null ?
            this.props.templates :
            this.props.templates.filter(
                (template) => (
                    (template.template_desks ?? []).includes(deskId)
                )
            );

        return (
            <EditorFieldSelect
                field={this.props.field ?? 'content_template'}
                label={this.props.label ?? gettext('Content Template')}
                options={templates}
                labelField="template_name"
                keyField="_id"
                valueAsString={true}
                {...this.props}
            />
        );
    }
}

export const EditorFieldContentTemplate = connect(mapStatToProps)(EditorFieldContentTemplateComponent);
