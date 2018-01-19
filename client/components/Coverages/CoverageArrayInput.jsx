import React from 'react';
import PropTypes from 'prop-types';

import {ContentBlock} from '../UI/SidePanel';
import {InputArray} from '../UI/Form';
import {CoverageEditor} from './CoverageEditor';
import {WORKSPACE} from '../../constants';

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
    currentWorkspace,
    readOnly,
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
                component={CoverageEditor}
                users={users}
                desks={desks}
                timeFormat={timeFormat}
                dateFormat={dateFormat}
                newsCoverageStatus={newsCoverageStatus}
                contentTypes={contentTypes}
                genres={genres}
                defaultValue={{
                    planning: {},
                    news_coverage_status: newsCoverageStatus[0]
                }}
                coverageProviders={coverageProviders}
                priorities={priorities}
                keywords={keywords}
                disableDeskSelection={currentWorkspace === WORKSPACE.AUTHORING}
                readOnly={readOnly}
                maxCount={maxCoverageCount}
                addOnly={addOnly}
                originalCount={originalCount}
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
    currentWorkspace: PropTypes.string,
};

CoverageArrayInput.defaultProps = {
    field: 'coverages',
    addButtonText: 'Add a coverage',
    maxCoverageCount: 0,
};
