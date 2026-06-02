import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {gettext, planningUtils, assignmentUtils} from '../../../utils';
import {WORKFLOW_STATE} from '../../../constants';
import {
    TextAreaInput,
    SelectInput,
    DateTimeInput,
    Field,
} from '../../UI/Form';
import {InternalNoteLabel} from '../../';
import {ContactField} from '../../Contacts/ContactField';

interface IProps {
    field: string;
    value: any;
    onChange: (field: string, value: any) => void;
    newsCoverageStatus: Array<any>;
    disabled: boolean;
    item?: any;
    diff: any;
    formProfile?: any;
    errors?: any;
    showErrors?: boolean;
    addNewsItemToPlanning: any;
    popupContainer?: () => HTMLElement;
    onFieldFocus: (field: string) => void;
    index: number;
    onPopupOpen: () => void;
    onPopupClose: () => void;
    coverageIndex: number;
    hasAssignment: boolean;
    onScheduleChanged: (field: string, value: any, currentValue: any) => void;
    genres: Array<any>;
}

export class ScheduledUpdateForm extends React.Component<IProps> {
    dom: {internalNote: any; popupContainer: any;};

    constructor(props) {
        super(props);
        this.onScheduleChanged = this.onScheduleChanged.bind(this);
        this.dom = {
            internalNote: null,
            popupContainer: null,
        };
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.hasAssignment && this.props.hasAssignment) {
            this.dom.internalNote.focus();
        }
    }

    onScheduleChanged(f, v) {
        this.props.onScheduleChanged(f, v, this.props.value);
    }

    render() {
        const {
            field,
            value,
            coverageIndex,
            index,
            onChange,
            newsCoverageStatus,
            disabled,
            item,
            diff,
            formProfile,
            errors,
            showErrors,
            addNewsItemToPlanning,
            popupContainer,
            onFieldFocus,
            onPopupOpen,
            onPopupClose,
            genres,
        } = this.props;


        const fieldProps = {
            item: item,
            diff: diff,
            onChange: onChange,
            formProfile: formProfile,
            errors: errors,
            showErrors: showErrors,
            onFocus: onFieldFocus,
        };

        const roFields = planningUtils.getCoverageReadOnlyFields(
            value,
            disabled,
            newsCoverageStatus,
            addNewsItemToPlanning
        );

        return (
            <div>
                <InternalNoteLabel
                    item={diff}
                    prefix={`coverages[${coverageIndex}].scheduled_updates[${index}].planning.`}
                    noteField="workflow_status_reason"
                    showTooltip={false}
                    showText
                    stateField= {value.workflow_status === WORKFLOW_STATE.CANCELLED ?
                        `coverages[${coverageIndex}].scheduled_updates[${index}].workflow_status` : 'state'}
                    className="form__row"
                />

                <Field
                    component={ContactField}
                    field={`${field}.planning.contact_info`}
                    profileName="contact_info"
                    label={assignmentUtils.getContactLabel(get(diff, field))}
                    defaultValue={null}
                    {...fieldProps}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                    singleValue={true}
                    readOnly={disabled}
                />

                <Field
                    row={false}
                    component={SelectInput}
                    field={`${field}.planning.genre`}
                    profileName="genre"
                    label={gettext('Genre')}
                    options={genres}
                    labelField="name"
                    readOnly={true}
                    language={diff.language}
                    {...fieldProps}
                />

                <Field
                    row={false}
                    component={TextAreaInput}
                    field={`${field}.planning.internal_note`}
                    profileName="internal_note"
                    label={gettext('Internal Note')}
                    readOnly={roFields.internal_note}
                    {...fieldProps}
                    refNode={(ref) => this.dom.internalNote = ref}
                />

                <Field
                    row={false}
                    component={SelectInput}
                    field={`${field}.news_coverage_status`}
                    profileName="news_coverage_status"
                    label={gettext('Coverage Status')}
                    defaultValue={planningUtils.defaultCoverageValues(newsCoverageStatus).news_coverage_status}
                    options={newsCoverageStatus}
                    {...fieldProps}
                    readOnly={roFields.newsCoverageStatus}
                    language={diff.language}
                />

                <Field
                    row={false}
                    component={DateTimeInput}
                    field={`${field}.planning.scheduled`}
                    profileName="scheduled"
                    label={gettext('Due')}
                    defaultValue={null}
                    {...fieldProps}
                    onChange={this.onScheduleChanged}
                    readOnly={roFields.scheduled}
                    popupContainer={popupContainer}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                />
            </div>
        );
    }
}
