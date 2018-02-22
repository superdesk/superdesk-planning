import React from 'react';
import PropTypes from 'prop-types';

import {ContentBlock} from '../UI/SidePanel';
import {InputArray} from '../UI/Form';
import {CoverageEditor} from './CoverageEditor';

import {gettext} from '../../utils';
import {COVERAGES} from '../../constants';

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
    currentWorkspace,
    readOnly,
    message,
    ...props,
}) => (
    <div>
        <h3 className="side-panel__heading side-panel__heading--big">
            {gettext('Coverages')}
        </h3>

        <ContentBlock>
            <InputArray
                field={field}
                value={value}
                onChange={onChange}
                addButtonText={addButtonText}
                element={CoverageEditor}
                users={users}
                desks={desks}
                timeFormat={timeFormat}
                dateFormat={dateFormat}
                currentWorkspace={currentWorkspace}
                newsCoverageStatus={newsCoverageStatus}
                contentTypes={contentTypes}
                genres={genres}
                defaultElement={COVERAGES.DEFAULT_VALUE(newsCoverageStatus, props.diff)}
                coverageProviders={coverageProviders}
                priorities={priorities}
                keywords={keywords}
                onDuplicateCoverage={onDuplicateCoverage}
                onCancelCoverage={onCancelCoverage}
                onAddCoverageToWorkflow={onAddCoverageToWorkflow}
                readOnly={readOnly}
                maxCount={maxCoverageCount}
                addOnly={addOnly}
                originalCount={originalCount}
                message={message}
                row={false}
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
    currentWorkspace: PropTypes.string,
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),

    item: PropTypes.object,
    diff: PropTypes.object,
    formProfile: PropTypes.object,
    errors: PropTypes.object,
    showErrors: PropTypes.bool,
};

CoverageArrayInput.defaultProps = {
    field: 'coverages',
    addButtonText: 'Add a coverage',
    maxCoverageCount: 0,
};
