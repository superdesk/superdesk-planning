import React from 'react';
import PropTypes from 'prop-types';
import {isEqual, get} from 'lodash';

import {ItemActionsMenu} from '../../index';
import {CollapseBox} from '../../UI';
import {CoverageItem} from '../CoverageItem';
import {CoverageForm} from './CoverageForm';
import {CoverageFormHeader} from './CoverageFormHeader';

import {planningUtils, gettext} from '../../../utils';
import {WORKSPACE} from '../../../constants';

export const CoverageEditor = ({
    field,
    value,
    users,
    desks,
    dateFormat,
    timeFormat,
    currentWorkspace,
    remove,
    contentTypes,
    genres,
    newsCoverageStatus,
    onChange,
    coverageProviders,
    priorities,
    keywords,
    onDuplicateCoverage,
    onCancelCoverage,
    readOnly,
}) => {
    // Coverage item actions
    let itemActions = [];

    if (!readOnly) {
        if (value.coverage_id) {
            const duplicateActions = contentTypes
                .filter((contentType) => (
                    contentType.qcode !== get(value, 'planning.g2_content_type')
                ))
                .map((contentType) => ({
                    label: contentType.name,
                    callback: onDuplicateCoverage.bind(null, value, contentType.qcode)
                }));

            itemActions = [{
                label: gettext('Duplicate'),
                icon: 'icon-copy',
                callback: onDuplicateCoverage.bind(null, value)
            },
            {
                label: gettext('Duplicate As'),
                icon: 'icon-copy',
                callback: duplicateActions,
            }];

            if (planningUtils.canCancelCoverage(value)) {
                itemActions.push({
                    label: gettext('Cancel coverage'),
                    icon: 'icon-close-small',
                    callback: onCancelCoverage.bind(null, value),
                });
            }
        }

        if (currentWorkspace === WORKSPACE.PLANNING &&
            !get(value, 'assigned_to.assignment_id')) {
            itemActions.push({
                label: gettext('Remove coverage'),
                icon: 'icon-trash',
                callback: onCancelCoverage.bind(null, value, true),
            });
        }
    }

    const itemActionComponent = get(itemActions, 'length', 0) > 0 ?
        (
            <ItemActionsMenu
                className="side-panel__top-tools-right"
                actions={itemActions} />
        ) : null;

    const coverageItem = (
        <CoverageItem
            coverage={value}
            users={users}
            desks={desks}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
            contentTypes={contentTypes}
            itemActionComponent={itemActionComponent}
            readOnly={readOnly}
        />
    );

    const coverageTopBar = (
        <CoverageFormHeader
            field={field}
            value={value}
            onChange={onChange}
            users={users}
            desks={desks}
            coverageProviders={coverageProviders}
            priorities={priorities}
            readOnly={readOnly}
            currentWorkspace={currentWorkspace}
        />
    );

    const coverageForm = (
        <CoverageForm
            field={field}
            value={value}
            onChange={onChange}
            newsCoverageStatus={newsCoverageStatus}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
            contentTypes={contentTypes}
            genres={genres}
            keywords={keywords}
            readOnly={readOnly}
        />
    );

    return (
        <CollapseBox
            collapsedItem={coverageItem}
            tools={itemActionComponent}
            openItemTopBar={coverageTopBar}
            openItem={coverageForm}
            scrollInView={true}
            isOpen={isEqual(value, {
                planning: {},
                news_coverage_status: newsCoverageStatus[0]
            })}
        />
    );
};

CoverageEditor.propTypes = {
    field: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    users: PropTypes.array,
    desks: PropTypes.array,
    newsCoverageStatus: PropTypes.array,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    remove: PropTypes.func,
    contentTypes: PropTypes.array,
    genres: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    keywords: PropTypes.array,
    readOnly: PropTypes.bool,
    onDuplicateCoverage: PropTypes.func,
    onCancelCoverage: PropTypes.func,
    currentWorkspace: PropTypes.string,
};

CoverageEditor.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
};
