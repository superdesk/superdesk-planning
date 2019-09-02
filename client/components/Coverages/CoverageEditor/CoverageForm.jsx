import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {getItemInArrayById, gettext, planningUtils, getItemWorkflowState} from '../../../utils';
import moment from 'moment';
import {WORKFLOW_STATE} from '../../../constants';


import {
    TextInput,
    TextAreaInput,
    SelectInput,
    DateTimeInput,
    SelectTagInput,
    Field,
    ToggleInput,
} from '../../UI/Form';
import {InternalNoteLabel} from '../../';
import {ContactField} from '../../Contacts';

export class CoverageForm extends React.Component {
    constructor(props) {
        super(props);
        this.onScheduleChanged = this.onScheduleChanged.bind(this);
        this.dom = {
            contentType: null,
            popupContainer: null,
        };
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.hasAssignment && this.props.hasAssignment) {
            this.dom.contentType.focus();
        }
    }

    onScheduleChanged(f, v) {
        const {value, onChange} = this.props;
        let finalValue = v, fieldStr, relatedFieldStr;

        // We will be updating scheduled and _scheduledTime together
        // relatedFieldStr will be '_scheduledTime' if date gets changed and vice versa
        // Update time only if date is already set
        if (f.endsWith('.date')) {
            fieldStr = f.slice(0, -5);
            relatedFieldStr = fieldStr.replace('scheduled', '_scheduledTime');
            // If there is no current scheduled date, then set the time value to end of the day
            if (!get(value, 'planning.scheduled')) {
                finalValue = v.add(1, 'hour').startOf('hour');
                relatedFieldStr = null;
            }
        } else if (f.endsWith('._scheduledTime')) {
            // If there is no current scheduled date, then set the date to today
            relatedFieldStr = f.slice(0, -4).replace('_', '');
            fieldStr = f;
            if (!get(value, 'planning.scheduled')) {
                finalValue = moment().hour(v.hour())
                    .minute(v.minute());
            } else {
                // Set the date from the original date
                finalValue = value.planning.scheduled.clone().hour(v.hour())
                    .minute(v.minute());
            }
        } else {
            onChange(f, v);
            return;
        }

        onChange(fieldStr, finalValue);
        if (relatedFieldStr) {
            onChange(relatedFieldStr, finalValue);
        }
    }

    render() {
        const {
            field,
            value,
            index,
            onChange,
            newsCoverageStatus,
            dateFormat,
            timeFormat,
            contentTypes,
            genres,
            keywords,
            readOnly,
            item,
            diff,
            formProfile,
            errors,
            showErrors,
            hasAssignment,
            defaultGenre,
            addNewsItemToPlanning,
            popupContainer,
            onFieldFocus,
            onPopupOpen,
            onPopupClose,
        } = this.props;

        const contentTypeQcode = get(value, 'planning.g2_content_type') || null;
        const contentType = contentTypeQcode ? getItemInArrayById(contentTypes, contentTypeQcode, 'qcode') : null;
        const onContentTypeChange = (f, v) => {
            if (v) {
                onChange(f, get(v, 'qcode') || null);
                onChange(`${field}.planning.genre`, null);
            }
        };

        if (contentTypeQcode === 'text' && !get(value, 'planning.genre')) {
            value.planning.genre = defaultGenre;
        }

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
            readOnly,
            newsCoverageStatus,
            addNewsItemToPlanning
        );

        return (
            <div>
                <InternalNoteLabel
                    item={diff}
                    prefix={`coverages[${index}].planning.`}
                    noteField="workflow_status_reason"
                    showTooltip={false}
                    showText
                    stateField= {getItemWorkflowState(diff) === WORKFLOW_STATE.DRAFT ?
                        `coverages[${index}].workflow_status` : 'state'}
                    className="form__row" />
                <Field
                    component={SelectInput}
                    field={`${field}.planning.g2_content_type`}
                    profileName="g2_content_type"
                    label={gettext('Coverage Type')}
                    options={contentTypes}
                    labelField="name"
                    clearable={false}
                    value={contentType}
                    defaultValue={null}
                    {...fieldProps}
                    onChange={onContentTypeChange}
                    readOnly={roFields.g2_content_type}
                    autoFocus={hasAssignment}
                    refNode={(ref) => this.dom.contentType = ref}
                />

                <Field
                    component={SelectInput}
                    field={`${field}.planning.genre`}
                    profileName="genre"
                    label={gettext('Genre')}
                    options={genres}
                    labelField="name"
                    clearable={true}
                    defaultValue={contentTypeQcode === 'text' ? defaultGenre : null}
                    readOnly={roFields.genre}
                    {...fieldProps}
                />

                <Field
                    component={TextInput}
                    field={`${field}.planning.slugline`}
                    profileName="slugline"
                    label={gettext('Slugline')}
                    readOnly={roFields.slugline}
                    autoFocus={hasAssignment && roFields.g2_content_type}
                    {...fieldProps}
                />

                <Field
                    component={TextAreaInput}
                    field={`${field}.planning.ednote`}
                    profileName="ednote"
                    label={gettext('Ed Note')}
                    readOnly={roFields.ednote}
                    {...fieldProps}
                />

                <Field
                    component={SelectTagInput}
                    field={`${field}.planning.keyword`}
                    profileName="keyword"
                    label={gettext('Keywords')}
                    defaultValue={[]}
                    options={keywords}
                    readOnly={roFields.keyword}
                    {...fieldProps}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                />

                <Field
                    component={TextAreaInput}
                    field={`${field}.planning.internal_note`}
                    profileName="internal_note"
                    label={gettext('Internal Note')}
                    readOnly={roFields.internal_note}
                    {...fieldProps}
                />

                <Field
                    component={ContactField}
                    field={`${field}.planning.contact_info`}
                    profileName="contact_info"
                    label={gettext('Coverage Provider Contact')}
                    defaultValue={[]}
                    {...fieldProps}
                    readOnly={readOnly}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                    singleValue={true} />

                <Field
                    component={SelectInput}
                    field={`${field}.news_coverage_status`}
                    profileName="news_coverage_status"
                    label={gettext('Coverage Status')}
                    defaultValue={planningUtils.defaultCoverageValues(newsCoverageStatus).news_coverage_status}
                    options={newsCoverageStatus}
                    {...fieldProps}
                    readOnly={roFields.newsCoverageStatus}
                />

                <Field
                    component={DateTimeInput}
                    field={`${field}.planning.scheduled`}
                    profileName="scheduled"
                    label={gettext('Due')}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    defaultValue={null}
                    row={false}
                    {...fieldProps}
                    onChange={this.onScheduleChanged}
                    readOnly={roFields.scheduled}
                    popupContainer={popupContainer}
                    onPopupOpen={onPopupOpen}
                    onPopupClose={onPopupClose}
                    timeField={`${field}.planning._scheduledTime`}
                />

                <Field
                    component={ToggleInput}
                    field={`${field}.flags.no_content_linking`}
                    label={gettext('Do not link content updates')}
                    labelLeft={true}
                    defaultValue={false}
                    {...fieldProps}
                    readOnly={roFields.flags}
                    profileName="flags"
                />
            </div>
        );
    }
}

CoverageForm.propTypes = {
    field: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    newsCoverageStatus: PropTypes.array,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    contentTypes: PropTypes.array,
    genres: PropTypes.array,
    keywords: PropTypes.array,
    readOnly: PropTypes.bool,
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),

    item: PropTypes.object,
    diff: PropTypes.object,
    formProfile: PropTypes.object,
    errors: PropTypes.object,
    showErrors: PropTypes.bool,
    hasAssignment: PropTypes.bool,
    defaultGenre: PropTypes.object,
    addNewsItemToPlanning: PropTypes.object,
    popupContainer: PropTypes.func,
    onFieldFocus: PropTypes.func,
    index: PropTypes.number,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
};

CoverageForm.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
};
