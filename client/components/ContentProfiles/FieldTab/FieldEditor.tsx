import * as React from 'react';

import {IProfileFieldEntry} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {getFieldNameTranslated} from '../../../utils/contentProfiles';

import {Button, ButtonGroup, Checkbox, Input, Alert} from 'superdesk-ui-framework/react';

interface IProps {
    item: IProfileFieldEntry;
    isDirty: boolean;
    disableMinMax: boolean;
    disableRequired: boolean;
    systemRequired: boolean;
    closeEditor(): void;
    saveField(): void;
    updateFieldSchema(field: string, value: number | boolean): void;
}

export class FieldEditor extends React.PureComponent<IProps> {
    containerRef: React.RefObject<HTMLDivElement>

    constructor(props) {
        super(props);

        this.containerRef = React.createRef();
    }

    componentDidMount() {
        // Place focus on the first `input` element in the form
        this.containerRef.current?.querySelector('input')?.focus();
    }

    changeBoolean(field: string, value: boolean) {
        this.props.updateFieldSchema(field, value);
    }

    changeNumber(field: string, value: string) {
        this.props.updateFieldSchema(field, parseInt(value, 10) || null);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const disableMinMax = this.props.disableMinMax || !['string', 'list'].includes(this.props.item.schema.type);
        const noOptionsAvailable = disableMinMax && this.props.disableRequired;

        return (
            <div className="side-panel side-panel--right">
                <div className="side-panel__header">
                    <div className="side-panel__heading">
                        {gettext('Details')}
                    </div>
                    <div className="side-panel__sliding-toolbar">
                        <span className="sd-text__strong">
                            {getFieldNameTranslated(this.props.item.name)}
                        </span>
                        <ButtonGroup align="right">
                            <Button
                                text={gettext('Cancel')}
                                onClick={() => this.props.closeEditor()}
                            />
                            {noOptionsAvailable ? null : (
                                <Button
                                    text={gettext('Save')}
                                    onClick={() => this.props.saveField()}
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

                                    {(this.props.disableRequired || this.props.systemRequired) ? null : (
                                        <div className="form__group">
                                            <div className="form__row">
                                                <Checkbox
                                                    checked={this.props.item.schema.required}
                                                    label={{text: gettext('Required')}}
                                                    onChange={this.changeBoolean.bind(this, 'required')}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {disableMinMax ? null : (
                                        <React.Fragment>
                                            <div className="form__group">
                                                <div className="form__row">
                                                    <Input
                                                        label={gettext('Min')}
                                                        onChange={this.changeNumber.bind(this, 'minlength')}
                                                        value={this.props.item.schema.minlength?.toString()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form__group">
                                                <div className="form__row">
                                                    <Input
                                                        label={gettext('Max')}
                                                        onChange={this.changeNumber.bind(this, 'maxlength')}
                                                        value={this.props.item.schema.maxlength?.toString()}
                                                    />
                                                </div>
                                            </div>
                                        </React.Fragment>
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
