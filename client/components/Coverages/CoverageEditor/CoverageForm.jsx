import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';
import {getItemInArrayById} from '../../../utils';

import {
    Row,
    TextInput,
    TextAreaInput,
    SelectInput,
    DateTimeInput,
    SelectTagInput,
} from '../../UI/Form';

export const CoverageForm = ({
    field,
    value,
    onChange,
    newsCoverageStatus,
    dateFormat,
    timeFormat,
    contentTypes,
    genres,
    keywords,
}) => {
    const onScheduleChanged = (f, v) => {
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
    };

    const contentTypeQcode = get(value, 'planning.g2_content_type') || null;
    const contentType = contentTypeQcode ? getItemInArrayById(contentTypes, contentTypeQcode, 'qcode') : null;
    const onContentTypeChange = (f, v) => onChange(f, get(v, 'qcode') || null);

    return (
        <div>
            <Row>
                <SelectInput
                    field={`${field}.planning.g2_content_type`}
                    label="Content Type"
                    value={contentType}
                    onChange={onContentTypeChange}
                    options={contentTypes}
                    labelField="name"
                    clearable={true}
                />
            </Row>

            {contentTypeQcode === 'text' && (
                <Row>
                    <SelectInput
                        field={`${field}.planning.genre`}
                        label="Genre"
                        value={get(value, 'planning.genre')}
                        onChange={onChange}
                        options={genres}
                        labelField="name"
                        clearable={true}
                    />
                </Row>
            )}

            <Row>
                <TextInput
                    field={`${field}.planning.slugline`}
                    label="Slugline"
                    value={get(value, 'planning.slugline', '')}
                    onChange={onChange}
                />
            </Row>

            <Row>
                <TextAreaInput
                    field={`${field}.planning.ednote`}
                    label="Ed Note"
                    value={get(value, 'planning.ednote', '')}
                    onChange={onChange}
                />
            </Row>

            <SelectTagInput
                field={`${field}.planning.keyword`}
                label="Keywords"
                value={get(value, 'planning.keyword', [])}
                onChange={onChange}
                options={keywords}
            />

            <Row>
                <TextAreaInput
                    field={`${field}.planning.internal_note`}
                    label="Internal Note"
                    value={get(value, 'planning.internal_note', '')}
                    onChange={onChange}
                />
            </Row>

            <Row>
                <SelectInput
                    field={`${field}.news_coverage_status`}
                    label="Coverage Status"
                    value={get(value, 'news_coverage_status')}
                    onChange={onChange}
                    options={newsCoverageStatus}
                />
            </Row>

            <DateTimeInput
                field={`${field}.planning.scheduled`}
                label="Due"
                value={get(value, 'planning.scheduled', null)}
                onChange={onScheduleChanged}
                timeFormat={timeFormat}
                dateFormat={dateFormat}
            />
        </div>
    );
};

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
};

CoverageForm.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
};
