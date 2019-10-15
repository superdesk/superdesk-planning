import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {getItemInArrayById, gettext, planningUtils, generateTempId} from '../../../utils';
import moment from 'moment';
import {WORKFLOW_STATE, DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT, TO_BE_CONFIRMED_FIELD} from '../../../constants';
import {Button} from '../../UI';
import {Row, Label, LineInput} from '../../UI/Form';
import {ScheduledUpdate} from '../ScheduledUpdate';


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
        this.onTimeToBeConfirmed = this.onTimeToBeConfirmed.bind(this);
        this.onAddScheduledUpdate = this.onAddScheduledUpdate.bind(this);
        this.onRemoveScheduledUpdate = this.onRemoveScheduledUpdate.bind(this);
        this.onScheduledUpdateClose = this.onScheduledUpdateClose.bind(this);
        this.onScheduledUpdateOpen = this.onScheduledUpdateOpen.bind(this);
        this.dom = {
            contentType: null,
            popupContainer: null,
        };
        this.state = {openScheduledUpdates: []};
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.hasAssignment && this.props.hasAssignment) {
            this.dom.contentType.focus();
        }
    }

    onTimeToBeConfirmed() {
        const {onChange, index} = this.props;

        onChange(`coverages[${index}].${TO_BE_CONFIRMED_FIELD}`, true);
    }

    onScheduleChanged(f, v) {
        const {value, onChange, index} = this.props;
        let finalValue = v, fieldStr, relatedFieldStr;

        // We will be updating scheduled and _scheduledTime together
        // relatedFieldStr will be '_scheduledTime' if date gets changed and vice versa
        // Update time only if date is already set
        if (f.endsWith('.date')) {
            fieldStr = f.slice(0, -5);
            relatedFieldStr = f.replace('scheduled.date', '_scheduledTime');
            // If there is no current scheduled date, then set the time value to end of the day
            if (!get(value, 'planning.scheduled')) {
                finalValue = v.add(1, 'hour').startOf('hour');
                relatedFieldStr = null;
            }
        } else if (f.endsWith('._scheduledTime')) {
            // If there is no current scheduled date, then set the date to today
            relatedFieldStr = f.replace('_scheduledTime', 'scheduled');
            fieldStr = f;

            onChange(`coverages[${index}].${TO_BE_CONFIRMED_FIELD}`, false);

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

    onAddScheduledUpdate() {
        let defaultScheduledUpdate = {
            coverage_id: get(this.props, 'value.coverage_id'),
            scheduled_update_id: generateTempId(),
            planning: {
                internal_note: get(this.props, 'value.planning.internal_note'),
                genre: ((get(this.props, 'genres') || []).find((g) => g.qcode === 'Update') ||
                    get(this.props, 'value.planning.genre')),
            },
            news_coverage_status: this.props.newsCoverageStatus[0],
            workflow_status: WORKFLOW_STATE.DRAFT,
        };

        // Set default desks for coverage type
        planningUtils.setDefaultAssignment(defaultScheduledUpdate, this.props.preferredCoverageDesks,
            get(this.props, 'value.planning.g2_content_type'), this.props.defaultDesk);

        this.props.onChange(`${this.props.field}.scheduled_updates`,
            [
                ...get(this.props, 'value.scheduled_updates', []),
                defaultScheduledUpdate,
            ]);
        this.setState({openScheduledUpdates: [
            ...this.state.openScheduledUpdates,
            defaultScheduledUpdate.scheduled_update_id,
        ]});
    }

    onRemoveScheduledUpdate(index) {
        // Remove the scheduled update at the index
        this.props.onChange(`${this.props.field}.scheduled_updates`,
            this.props.value.scheduled_updates.filter((s, ind) => ind !== index));
    }

    onScheduledUpdateOpen(scheduledUpdate) {
        if (!this.state.openScheduledUpdates.includes(scheduledUpdate.scheduled_update_id)) {
            this.setState({openScheduledUpdates: [
                ...this.state.openScheduledUpdates,
                scheduledUpdate.scheduled_update_id,
            ]});
        }
    }

    onScheduledUpdateClose(scheduledUpdate) {
        this.setState({
            openScheduledUpdates: this.state.openScheduledUpdates.filter((s) =>
                s !== scheduledUpdate.scheduled_update_id
            )});
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
            planningAllowScheduledUpdates,
            onRemoveAssignment,
            setCoverageDefaultDesk,
            ...props
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
                    stateField={value.workflow_status === WORKFLOW_STATE.CANCELLED ?
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
                    showToBeConfirmed
                    toBeConfirmed={get(value, TO_BE_CONFIRMED_FIELD)}
                    onToBeConfirmed={this.onTimeToBeConfirmed}
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

                {planningAllowScheduledUpdates && contentTypeQcode === 'text' && (
                    <Row>
                        <LineInput><Label text={gettext('SCHEDULED UPDATES')}/></LineInput>
                        {(value.scheduled_updates || []).map((s, i) => (
                            <ScheduledUpdate
                                key={i}
                                value={s}
                                field={field}
                                coverageIndex={index}
                                index={i}
                                newsCoverageStatus={newsCoverageStatus}
                                dateFormat={dateFormat}
                                timeFormat={timeFormat}
                                readOnly={readOnly}
                                contentTypes={contentTypes}
                                onRemoveAssignment={onRemoveAssignment}
                                setCoverageDefaultDesk={setCoverageDefaultDesk}
                                onRemove={this.onRemoveScheduledUpdate.bind(null, i)}
                                onScheduleChanged={this.onScheduleChanged}
                                genres={genres}
                                onClose={this.onScheduledUpdateClose}
                                onOpen={this.onScheduledUpdateOpen}
                                openScheduledUpdates={this.state.openScheduledUpdates}
                                {...fieldProps}
                                {...props} />
                        ))}
                        {!get(diff, `${field}.flags.no_content_linking`) && <Button
                            color="primary"
                            text={gettext('Schedule an update')}
                            onClick={this.onAddScheduledUpdate}
                        />}
                    </Row>)}

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
    preferredCoverageDesks: PropTypes.object,
    defaultDesk: PropTypes.object,
    planningAllowScheduledUpdates: PropTypes.bool,
    onRemoveAssignment: PropTypes.func,
    setCoverageDefaultDesk: PropTypes.func,
};

CoverageForm.defaultProps = {
    dateFormat: DEFAULT_DATE_FORMAT,
    timeFormat: DEFAULT_TIME_FORMAT,
};
