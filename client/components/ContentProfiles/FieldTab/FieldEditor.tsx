import * as React from 'react';

import {IProfileFieldEntry, IPlanningContentProfile, IProfileSchemaTypeString} from '../../../interfaces';
import {superdeskApi, planningApi} from '../../../superdeskApi';

import {getFieldNameTranslated} from '../../../utils/contentProfiles';

import {Button, ButtonGroup, Checkbox, Alert} from 'superdesk-ui-framework/react';
import {renderFieldsForPanel} from '../../fields';

interface IProps {
    item: IProfileFieldEntry;
    profile: IPlanningContentProfile;
    isDirty: boolean;
    disableMinMax: boolean;
    disableRequired: boolean;
    systemRequired: boolean;
    closeEditor(): void;
    saveField(): void;
    updateField(field: string, value: string | number | boolean | Array<string>): void;
}

interface IState {
    errors: {[field: string]: string};
}

export class FieldEditor extends React.Component<IProps, IState> {
    containerRef: React.RefObject<HTMLDivElement>

    constructor(props) {
        super(props);

        this.state = {errors: {}};

        this.containerRef = React.createRef();
        this.onChange = this.onChange.bind(this);
        this.saveField = this.saveField.bind(this);
    }

    componentDidMount() {
        // Place focus on the first `input` element in the form
        this.containerRef.current?.querySelector('input')?.focus();
    }

    onChange(field: string, value: string | number | boolean | Array<string>) {
        this.props.updateField(field, value);
    }

    saveField() {
        if (this.props.item.name === 'language') {
            const schema = (this.props.item.schema as IProfileSchemaTypeString);

            if (schema.multilingual === true) {
                const {gettext} = superdeskApi.localization;
                const errors = {};

                if ((schema.languages?.length ?? 0) < 2) {
                    errors['schema.languages'] = gettext('At least 2 languages must be selected');
                }
                if (!schema.default_language?.length) {
                    errors['schema.default_language'] = gettext('Default language is a required field');
                }

                this.setState({errors});

                if (Object.keys(errors).length) {
                    return;
                }
            }
        }

        this.props.saveField();
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const disableMinMax = this.props.disableMinMax || !['string', 'list'].includes(this.props.item.schema.type);
        const fieldType = this.props.item.schema?.type !== 'string' ?
            null :
            this.props.item.schema.field_type;
        const {multilingual} = planningApi.contentProfiles;

        const isMultilingual = this.props.item.name === 'language' ?
            (this.props.item.schema as IProfileSchemaTypeString).multilingual === true :
            multilingual.isEnabled(this.props.profile);

        const fieldProps = {
            'schema.required': {enabled: !(this.props.disableRequired || this.props.systemRequired)},
            'schema.read_only': {enabled: this.props.item.name === 'related_plannings'},
            'schema.planning_auto_publish': {enabled: this.props.item.name === 'related_plannings'},
            'schema.field_type': {enabled: fieldType != null},
            'schema.minlength': {enabled: !disableMinMax},
            'schema.maxlength': {enabled: !disableMinMax},
            'schema.expandable': {enabled: fieldType === 'multi_line'},
            'schema.format_options': {enabled: fieldType === 'editor_3'},
            'schema.vocabularies': {enabled: this.props.item.name === 'custom_vocabularies'},
            'field.all_day.enabled': {enabled: this.props.item.name === 'dates'},
            'field.default_duration_on_change': {enabled: this.props.item.name === 'dates'},
            'schema.languages': {enabled: (this.props.item.name === 'language' && isMultilingual)},
            'schema.default_language': {enabled: (this.props.item.name === 'language' && isMultilingual)},
            'schema.multilingual': {enabled: (
                this.props.item.name === 'language' || (
                    this.props.item.schema?.type === 'string' &&
                    isMultilingual &&
                    !['language', 'location'].includes(this.props.item.name)
                )
            )},
            'schema.default_value': {enabled: this.props.item.name === 'priority'},
        };
        const noOptionsAvailable = !(
            Object.values(fieldProps)
                .filter((fieldProp) => fieldProp.enabled)
                .length
        );

        return (
            <div className="side-panel side-panel--right" data-test-id="content-field--editor">
                <div className="side-panel__header">
                    <div className="side-panel__heading">
                        {gettext('Details')}
                    </div>
                    <div className="side-panel__sliding-toolbar">
                        <span className="sd-text__strong">
                            {getFieldNameTranslated(this.props.item.name)}
                        </span>
                        <ButtonGroup align="end">
                            <Button
                                text={gettext('Cancel')}
                                onClick={() => this.props.closeEditor()}
                            />
                            {noOptionsAvailable ? null : (
                                <Button
                                    text={gettext('Save')}
                                    onClick={this.saveField}
                                    type="primary"
                                    disabled={!this.props.isDirty}
                                />
                            )}
                        </ButtonGroup>
                    </div>
                </div>
                <div className="side-panel__content" ref={this.containerRef}>
                    <div className="side-panel__content-block side-panel__content-block--flex">
                        <div className="side-panel__content-block-inner side-panel__content-block-inner--grow">
                            {noOptionsAvailable ? (
                                <Alert
                                    style="hollow"
                                    size="normal"
                                    type="warning"
                                >
                                    {gettext('No options available for this field')}
                                </Alert>
                            ) : (
                                <React.Fragment>
                                    {!this.props.systemRequired ? null : (
                                        <React.Fragment>
                                            <Alert
                                                style="hollow"
                                                size="normal"
                                                type="warning"
                                            >
                                                {gettext('This field is required by the system')}
                                            </Alert>
                                            <div className="form__group">
                                                <div className="form__row">
                                                    <Checkbox
                                                        checked={true}
                                                        label={{text: gettext('Required')}}
                                                        onChange={() => false}
                                                        disabled={true}
                                                    />
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    )}
                                    {renderFieldsForPanel(
                                        'editor',
                                        {
                                            'schema.required': {enabled: true, index: 1},
                                            'schema.read_only': {enabled: true, index: 2},
                                            'schema.field_type': {enabled: true, index: 3},
                                            'schema.expandable': {enabled: true, index: 4},
                                            'schema.minlength': {enabled: true, index: 5},
                                            'schema.maxlength': {enabled: true, index: 6},
                                            'schema.format_options': {enabled: true, index: 7},
                                            'schema.vocabularies': {enabled: true, index: 8},
                                            'field.all_day.enabled': {enabled: true, index: 9},
                                            'field.default_duration_on_change': {enabled: true, index: 10},
                                            'schema.multilingual': {enabled: true, index: 11},
                                            'schema.languages': {enabled: true, index: 12},
                                            'schema.default_language': {enabled: true, index: 13},
                                            'schema.planning_auto_publish': {enabled: true, index: 14},
                                            'schema.default_value': {enabled: true, index: 11},
                                        },
                                        {
                                            item: this.props.item,
                                            onChange: this.onChange,
                                            errors: this.state.errors,
                                            showErrors: true,
                                        },
                                        fieldProps
                                    )}
                                </React.Fragment>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
