import * as React from 'react';

import {
    IProfileFieldEntry,
    IPlanningContentProfile,
    IProfileSchemaTypeString,
    IEventFormProfile,
    ICoverageFormProfile,
} from '../../../interfaces';

import {superdeskApi, planningApi} from '../../../superdeskApi';

import {Button, ButtonGroup, Checkbox, Alert} from 'superdesk-ui-framework/react';
import {renderFieldsForPanel} from '../../fields';
import {coverageProfiles} from '../../../selectors/coverageProfiles';

interface IProps {
    item: IProfileFieldEntry;
    profile: IPlanningContentProfile;
    isProfileCoverage?: boolean;
    isDirty: boolean;
    disableMinMax: boolean;
    disableRequired: boolean;
    systemRequired: boolean;
    closeEditor(): void;
    saveField(): void;
    updateField(field: string, value: string | number | boolean | Array<string>): void;
    getFieldName(fieldEntry: IProfileFieldEntry): JSX.Element;
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
        const disableMinMax = this.props.disableMinMax || !['string', 'list'].includes(this.props.item.schema?.type);
        const fieldType = this.props.item.schema?.type !== 'string' ?
            null :
            this.props.item.schema.field_type;
        const {multilingual} = planningApi.contentProfiles;

        const isMultilingual = this.props.item.name === 'language' ?
            (this.props.item.schema as IProfileSchemaTypeString).multilingual === true :
            multilingual.isEnabled(this.props.profile);
        const storeState = planningApi.redux.store.getState();
        const allCoverageProfileIds = coverageProfiles(storeState).map((x) => x._id);
        const nameof = superdeskApi.helpers.nameof<
            Partial<IEventFormProfile['editor']> &
            Partial<ICoverageFormProfile['editor']>
        >;

        const fieldProps = {
            'schema.show_in_embedded_editor': {
                /**
                 * Coverage fields don't need this field config option, only planning and event
                 */
                enabled: !([nameof('related_plannings'), 'associated_event'].includes(this.props.item.name))
                    && !this.props.systemRequired
                    && this.props.profile.type !== 'coverage'
                    && allCoverageProfileIds.includes(this.props.profile._id) === false,
            },
            'schema.required': {enabled: !(this.props.disableRequired || this.props.systemRequired)},
            'schema.read_only': {
                enabled:
                    this.props.item.name === nameof('related_plannings') ||
                    this.props.item.name === nameof('multiple_content')
            },
            'schema.planning_auto_publish': {
                enabled: this.props.item.name === nameof('related_plannings')
            },
            'schema.cancel_plan_with_event': {
                enabled: this.props.item.name === nameof('related_plannings')
            },
            'schema.field_type': {enabled: fieldType != null},
            'schema.minlength': {enabled: !disableMinMax},
            'schema.maxlength': {enabled: !disableMinMax},
            'schema.expandable': {enabled: fieldType === 'multi_line'},
            'schema.format_options': {enabled: fieldType === 'editor_3'},
            'field.all_day.enabled': {enabled: this.props.item.name === 'dates'},
            'field.default_duration_on_change': {enabled: this.props.item.name === 'dates'},
            'schema.languages': {enabled: (this.props.item.name === 'language' && isMultilingual)},
            'schema.default_language': {enabled: (this.props.item.name === 'language' && isMultilingual)},
            'schema.multilingual': {enabled: this.props.isProfileCoverage ? false : (
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
            <div style={{height: 'auto'}} className="side-panel side-panel--right" data-test-id="content-field--editor">
                <div className="side-panel__header">
                    <div className="side-panel__heading a11y-only">
                        {gettext('Details')}
                    </div>
                    <div className="side-panel__sliding-toolbar">
                        <ButtonGroup align="end">
                            <Button
                                text={gettext('Cancel')}
                                onClick={() => this.props.closeEditor()}
                            />
                            {noOptionsAvailable ? null : (
                                <Button
                                    text={gettext('Apply')}
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
                                            'schema.show_in_embedded_editor': {enabled: true, index: 2},
                                            'schema.read_only': {enabled: true, index: 3},
                                            'schema.field_type': {enabled: true, index: 4},
                                            'schema.expandable': {enabled: true, index: 5},
                                            'schema.minlength': {enabled: true, index: 6},
                                            'schema.maxlength': {enabled: true, index: 7},
                                            'schema.format_options': {enabled: true, index: 8},
                                            'field.all_day.enabled': {enabled: true, index: 10},
                                            'field.default_duration_on_change': {enabled: true, index: 11},
                                            'schema.multilingual': {enabled: true, index: 12},
                                            'schema.languages': {enabled: true, index: 13},
                                            'schema.default_language': {enabled: true, index: 14},
                                            'schema.planning_auto_publish': {enabled: true, index: 15},
                                            'schema.cancel_plan_with_event': {enabled: true, index: 16},
                                            'schema.default_value': {enabled: true, index: 17},
                                        },
                                        {
                                            item: this.props.item,
                                            onChange: this.onChange,
                                            errors: this.state.errors,
                                            showErrors: true,
                                        },
                                        fieldProps
                                    )}
                                    {this.props.item.name === nameof('multiple_content') ? (
                                        <div className="form__row">
                                            <Checkbox
                                                checked={Boolean(this.props.item.schema.default_value)}
                                                label={{text: gettext('Default Value')}}
                                                onChange={(value) => this.onChange('schema.default_value', value)}
                                                disabled={false}
                                            />
                                        </div>
                                    ) : null}
                                </React.Fragment>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
