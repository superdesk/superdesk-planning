import React from 'react';
import classNames from 'classnames';
import {get, noop} from 'lodash';

import {Button} from '../../';
import {Row, LineInput} from '../';
import './style.scss';
import {superdeskApi} from '../../../../superdeskApi';
import {
    EDITOR_TYPE,
    ICoverageType,
    IG2ContentType,
    IInputArrayHocModeOptions,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus,
} from 'interfaces';
import {IDesk} from 'superdesk-api';
import {Spacer} from 'superdesk-ui-framework/react';

interface IProps {
    field: string;
    value: Array<any>;
    onChange(field: string, value: Array<any>): void;
    addButtonComponent: React.ComponentClass;
    addButtonProps: any;
    addButtonText: string;
    maxCount: number;
    addOnly: boolean;
    originalCount: number;
    element: React.ComponentClass<any>;
    createCoverage: (coverageType: ICoverageType) => DeepPartial<IPlanningCoverageItem>;
    disabled: boolean;
    message: any;
    invalid: boolean;
    buttonWithLabel: boolean;
    label: string;
    labelClassName: string;
    hint: string;
    required: boolean;
    boxed: boolean;
    noMargin: boolean;
    item: any;
    diff: any;
    formProfile: any;
    errors: {[key: string]: any};
    showErrors: boolean;
    testId?: string;
    getRef?(field: string, value: any): React.RefObject<any>;
    popupContainer(): HTMLElement;
    onPopupOpen(): void;
    onPopupClose(): void;
    contentTypes: Array<IG2ContentType>;
    defaultDesk: IDesk;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    navigation: any;
    openCoverageIds: Array<string>;
    editorType: EDITOR_TYPE;

    // HOC mode - optional; added to support "add button" as mini toolbar in authoring-react
    children?: (options: IInputArrayHocModeOptions) => React.ReactNode;
}

export class InputArray extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.onAdd = this.onAdd.bind(this);
        this.remove = this.remove.bind(this);
    }

    onAdd(coverageType: ICoverageType) {
        const currentValue = this.props.value ?? [];

        const newItem = this.props.createCoverage(coverageType);

        this.props.onChange(this.props.field, [...currentValue, newItem]);
    }

    remove(index: number) {
        const {gettext} = superdeskApi.localization;
        const {confirm, notify} = superdeskApi.ui;

        confirm(
            gettext('Remove Coverage'),
            undefined,
            gettext('Delete'),
        ).then((response) => {
            if (response) {
                this.props.onChange(
                    this.props.field,
                    (this.props.value ?? []).filter((value, i) => i !== index)
                );
                notify.success(
                    gettext('The coverage has been removed')
                );
            }
        });
    }

    renderButton() {
        if (this.props.addButtonComponent != null) {
            const AddButton = this.props.addButtonComponent;

            return (
                <AddButton
                    onAdd={this.onAdd}
                    {...this.props.addButtonProps}
                />
            );
        }

        const props = {
            onAdd: this.onAdd,
            text: this.props.addButtonText,
            tabIndex: 0,
            enterKeyIsClick: true,
        };

        return <Button {...props} />;
    }

    render() {
        const {
            field,
            value = [],
            onChange,
            addButtonComponent,
            addButtonProps,
            addButtonText,
            maxCount = 0,
            addOnly,
            originalCount,
            element,
            disabled,
            message,
            invalid,
            buttonWithLabel,
            label,
            labelClassName,
            testId,
            ...props
        } = this.props;

        const Component = element;
        const showAddButton = (maxCount ? value.length < maxCount : true) && !disabled;
        const isIndexReadOnly = (index) => (addOnly && index === originalCount) ? false : disabled;
        const addButton = this.renderButton();

        const hasLabel = (label ?? '').length > 0;
        const addButtonElement = showAddButton && addButton;
        const labelElement = !hasLabel ? null : (
            <Spacer h gap="0" justifyContent="space-between" alignItems="center" noWrap>
                <div className={classNames('InputArray__label', labelClassName)}>{label}</div>
                <div>
                    {buttonWithLabel && addButtonElement}
                </div>
            </Spacer>
        );
        const itemsElement = (value || []).map((val, index) => (
            <Component
                {...props}
                key={index}
                ref={this.props.getRef == null ? null : this.props.getRef(field, val)}
                testId={`${testId}[${index}]`}
                index={index}
                field={`${field}[${index}]`}
                onChange={onChange}
                value={val}
                remove={() => this.remove(index)}
                disabled={isIndexReadOnly(index)}
                message={get(message, `[${index}]`)}
                invalid={!!get(message, `[${index}]`)}
            />
        ));

        const errorMessageElement = get(message, field) && (
            <LineInput
                invalid={true}
                message={get(message, field)}
                readOnly
                noLabel
            />
        );

        const {DropZone} = superdeskApi.components;
        const {gettext} = superdeskApi.localization;

        const emptyValueElement = (
            <DropZone disabled canDrop={() => false} onDrop={noop}>
                {gettext('No Coverages Yet')}
            </DropZone>
        );

        if (typeof this.props.children === 'function') {
            return this.props.children({
                itemsElement,
                addButtonElement,
                errorMessageElement,
                labelElement,
                emptyValueElement,
            });
        } else {
            return (
                <>
                    <Row
                        noPadding={Object.keys(message ?? {}).length < 1}
                        testId={testId}
                    >
                        {labelElement}
                        {errorMessageElement}
                        {itemsElement}
                        {!buttonWithLabel && addButtonElement}
                    </Row>
                    {(this.props.value?.length ?? 0) < 1 && emptyValueElement}
                </>
            );
        }
    }
}
