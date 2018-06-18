import React from 'react';
import PropTypes from 'prop-types';

import {ContentBlock} from '../UI/SidePanel';
import {InputArray} from '../UI/Form';
import {CoverageEditor} from './CoverageEditor';
import {CoverageAddButton} from './CoverageAddButton';

import {gettext, planningUtils} from '../../utils';

export const CoverageArrayInput = ({
    field,
    value,
    onChange,
    addButtonText,
    users,
    desks,
    timeFormat,
    dateFormat,
    newsCoverageStatus,
    contentTypes,
    genres,
    coverageProviders,
    priorities,
    keywords,
    maxCoverageCount,
    addOnly,
    originalCount,
    onDuplicateCoverage,
    onCancelCoverage,
    onAddCoverageToWorkflow,
    onRemoveAssignment,
    addNewsItemToPlanning,
    readOnly,
    message,
    navigation,
    ...props
}) => (
    <div>
        <ContentBlock className="coverages__array">
            <InputArray
                label={gettext('Coverages')}
                labelClassName="side-panel__heading side-panel__heading--big"
                field={field}
                value={value}
                onChange={onChange}
                navigation={navigation}
                addButtonText={addButtonText}
                addButtonComponent={CoverageAddButton}
                addButtonProps={{contentTypes: contentTypes}}
                element={CoverageEditor}
                users={users}
                desks={desks}
                timeFormat={timeFormat}
                dateFormat={dateFormat}
                addNewsItemToPlanning={addNewsItemToPlanning}
                newsCoverageStatus={newsCoverageStatus}
                contentTypes={contentTypes}
                genres={genres}
                defaultElement={planningUtils.defaultCoverageValues.bind(null, newsCoverageStatus, props.diff)}
                coverageProviders={coverageProviders}
                priorities={priorities}
                keywords={keywords}
                onRemoveAssignment={onRemoveAssignment}
                onDuplicateCoverage={onDuplicateCoverage}
                onCancelCoverage={onCancelCoverage}
                onAddCoverageToWorkflow={onAddCoverageToWorkflow}
                readOnly={readOnly}
                maxCount={maxCoverageCount}
                addOnly={addOnly}
                originalCount={originalCount}
                message={message}
                row={false}
                buttonWithLabel
                {...props}
            />
        </ContentBlock>
    </div>
);

CoverageArrayInput.propTypes = {
    field: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func,
    addButtonText: PropTypes.string,
    users: PropTypes.array,
    desks: PropTypes.array,
    timeFormat: PropTypes.string,
    dateFormat: PropTypes.string,
    newsCoverageStatus: PropTypes.array,
    contentTypes: PropTypes.array,
    genres: PropTypes.array,
    defaultValue: PropTypes.object,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    keywords: PropTypes.array,
    readOnly: PropTypes.bool,
    maxCoverageCount: PropTypes.number,
    addOnly: PropTypes.bool,
    originalCount: PropTypes.number,
    onDuplicateCoverage: PropTypes.func,
    onCancelCoverage: PropTypes.func,
    onAddCoverageToWorkflow: PropTypes.func,
    onRemoveAssignment: PropTypes.func,
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),

    item: PropTypes.object,
    diff: PropTypes.object,
    formProfile: PropTypes.object,
    errors: PropTypes.object,
    showErrors: PropTypes.bool,
    addNewsItemToPlanning: PropTypes.object,
    navigation: PropTypes.object,
};

CoverageArrayInput.defaultProps = {
    field: 'coverages',
    addButtonText: 'Add a coverage',
    maxCoverageCount: 0,
};
