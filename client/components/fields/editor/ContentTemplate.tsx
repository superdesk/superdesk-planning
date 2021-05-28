import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IDesk} from 'superdesk-api';
import {IEditorFieldProps, IContentTemplate} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';
import {templates as getTemplates} from '../../../selectors/general';

interface IProps extends IEditorFieldProps {
    templates: Array<IContentTemplate>;
    deskId?: IDesk['_id'];
    clearable?: boolean;
}

const mapStateToProps = (state) => ({
    templates: getTemplates(state),
});

export class EditorFieldContentTemplateComponent extends React.PureComponent<IProps> {
    getFieldName(): string {
        return this.props.field ?? 'content_template';
    }

    getAvailableTemplates(): Array<IContentTemplate> {
        return this.props.deskId == null ?
            this.props.templates :
            this.props.templates.filter(
                (template) => (
                    (template.template_desks ?? []).includes(this.props.deskId)
                )
            );
    }

    isCurrentTemplateAvailable(): boolean {
        const value: IContentTemplate['_id'] = get(
            this.props.item,
            this.getFieldName(),
            this.props.defaultValue
        );

        if (value == null) {
            return true;
        }

        const index = this.getAvailableTemplates()
            .findIndex((template) => template._id === value);

        return index !== -1;
    }

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<{}>, snapshot?: any) {
        if (prevProps.deskId !== this.props.deskId && !this.isCurrentTemplateAvailable()) {
            // If the desk changes and the currently selected template is no longer available
            // then set the value to `null`
            this.props.onChange(this.getFieldName(), null);
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const templates = this.getAvailableTemplates();

        if (!templates.length) {
            return (
                <EditorFieldSelect
                    {...this.props}
                    options={[]}
                    placeholder={gettext('No Templates Available')}
                    readOnly={true}
                    valueAsString={true}
                    defaultValue={''}
                />
            );
        }

        return (
            <EditorFieldSelect
                {...this.props}
                field={this.getFieldName()}
                label={this.props.label ?? gettext('Content Template')}
                options={templates}
                labelField="template_name"
                keyField="_id"
                valueAsString={true}
            />
        );
    }
}

export const EditorFieldContentTemplate = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldContentTemplateComponent);
