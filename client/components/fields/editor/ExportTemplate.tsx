import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps, IPlanningExportTemplate} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';
import {getExportTemplates} from '../../../selectors/general';
import {ITEM_TYPE} from '../../../constants/index';

interface IProps extends IEditorFieldProps {
    templates: Array<IPlanningExportTemplate>;
    itemType?: IPlanningExportTemplate['type'];
    clearable?: boolean;
}

const mapStateToProps = (state) => ({
    templates: getExportTemplates(state),
});

export class EditorFieldExportTemplateComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const templates = this.props.itemType == null ?
            this.props.templates :
            this.props.templates.filter(
                (filter) => (
                    filter.type === this.props.itemType ||
                    (filter.type === ITEM_TYPE.EVENT && this.props.itemType === 'events')
                )
            );
        const field = this.props.field ?? 'export_template';

        if (!templates.length) {
            return (
                <EditorFieldSelect
                    {...this.props}
                    options={[]}
                    placeholder={gettext('No Templates Available')}
                    readOnly={true}
                />
            );
        }

        return (
            <EditorFieldSelect
                {...this.props}
                field={field}
                label={this.props.label ?? gettext('Export Template')}
                options={templates}
                labelField="label"
                keyField="name"
                valueAsString={true}
            />
        );
    }
}

export const EditorFieldExportTemplate = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldExportTemplateComponent);
