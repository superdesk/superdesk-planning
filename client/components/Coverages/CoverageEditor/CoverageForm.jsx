import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {getItemInArrayById, gettext, planningUtils} from '../../../utils';
import moment from 'moment';


import {
    TextInput,
    TextAreaInput,
    SelectInput,
    DateTimeInput,
    SelectTagInput,
    Field,
} from '../../UI/Form';

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

        if (f.endsWith('.date')) {
            // If there is no current scheduled date, then set the time value to end of the day
            if (!get(value, 'planning.scheduled')) {
                onChange(
                    f.slice(0, -5),
                    v.endOf('day')
                );
            } else {
                onChange(f.slice(0, -5), v);
            }
        } else if (f.endsWith('.time')) {
            // If there is no current scheduled date, then set the date to today
            if (!get(value, 'planning.scheduled')) {
                onChange(
                    f.slice(0, -5),
                    moment()
                        .hour(v.hour())
                        .minute(v.minute())
                );
            } else {
                onChange(f.slice(0, -5), v);
            }
        } else {
            onChange(f, v);
        }
    }

    render() {
        const {
            field,
            value,
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
        } = this.props;

        const contentTypeQcode = get(value, 'planning.g2_content_type') || null;
        const contentType = contentTypeQcode ? getItemInArrayById(contentTypes, contentTypeQcode, 'qcode') : null;
        const onContentTypeChange = (f, v) => onChange(f, get(v, 'qcode') || null);

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
                <Field
                    component={SelectInput}
                    field={`${field}.planning.g2_content_type`}
                    profileName="g2_content_type"
                    label={gettext('Coverage Type')}
                    options={contentTypes}
                    labelField="name"
                    clearable={true}
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
                    enabled={contentTypeQcode === 'text'}
                    field={`${field}.planning.genre`}
                    profileName="genre"
                    label={gettext('Genre')}
                    options={genres}
                    labelField="name"
                    clearable={true}
                    defaultValue={defaultGenre}
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
                    component={SelectInput}
                    field={`${field}.news_coverage_status`}
                    profileName="news_coverage_status"
                    label={gettext('Coverage Status')}
                    defaultValue={planningUtils.defaultCoverageValues(newsCoverageStatus).news_coverage_status}
                    options={newsCoverageStatus}
                    {...fieldProps}
                    readOnly={!!get(value, 'assigned_to.desk', readOnly)}
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
};

CoverageForm.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
};
