import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {ContactsPreviewList} from '../../Contacts/index';
import {Row as PreviewRow} from '../../UI/Preview';
import {ItemActionsMenu} from '../../index';
import {CollapseBox} from '../../UI';
import {CoverageItem} from '../CoverageItem';
import {ScheduledUpdateForm} from './ScheduledUpdateForm';
import {CoverageFormHeader} from '../CoverageEditor/CoverageFormHeader';
import {CoveragePreviewTopBar} from '../CoveragePreview/CoveragePreviewTopBar';

import {planningUtils, gettext, stringUtils, assignmentUtils} from '../../../utils';
import {PLANNING, COVERAGES} from '../../../constants';

export const ScheduledUpdate = ({
    diff,
    index,
    field,
    value,
    users,
    desks,
    onRemove,
    contentTypes,
    genres,
    newsCoverageStatus,
    onChange,
    coverageProviders,
    priorities,
    onRemoveAssignment,
    readOnly,
    addNewsItemToPlanning,
    popupContainer,
    onPopupOpen,
    onPopupClose,
    setCoverageDefaultDesk,
    openCoverageIds,
    autoAssignToWorkflow,
    onFocus,
    forPreview,
    onScheduleChanged,
    coverageIndex,
    openScheduledUpdates,
    onOpen,
    onClose,
    message,
    onAddScheduledUpdateToWorkflow,
    onCancelCoverage,
    testId,
    ...props
}) => {
    const coverage = get(diff, `coverages[${coverageIndex}]`);
    // Coverage item actions
    let itemActions = [];

    if (!readOnly && !addNewsItemToPlanning) {
        // To be done in the next iteration
        if (planningUtils.canCancelCoverage(value, diff, 'scheduled_update_id')) {
            itemActions.push({
                ...COVERAGES.ITEM_ACTIONS.CANCEL_COVERAGE,
                label: gettext('Cancel Scheduled Update'),
                callback: onCancelCoverage.bind(null, coverage, coverageIndex, value, index),
            });
        }

        if (planningUtils.canAddScheduledUpdateToWorkflow(value, autoAssignToWorkflow, diff, coverage)) {
            itemActions.push({
                id: 'addToWorkflow',
                label: gettext('Add to workflow'),
                icon: 'icon-assign',
                callback: onAddScheduledUpdateToWorkflow.bind(null, coverage, coverageIndex, value, index),
            });
        }

        if (planningUtils.canRemoveCoverage(value, diff)) {
            itemActions.push({
                label: gettext('Remove Scheduled Update'),
                icon: 'icon-trash',
                callback: onRemove,
            });
        }
    }

    const componentInvalid = get(message, `scheduled_updates.${index}`);
    const itemActionComponent = get(itemActions, 'length', 0) > 0 ?
        (
            <div className="side-panel__top-tools-right">
                <ItemActionsMenu
                    field={field}
                    actions={itemActions}
                    onOpen={onFocus}
                />
            </div>
        ) :
        null;
    const fieldName = `${field}.scheduled_updates[${index}]`;

    const coverageItem = (
        <CoverageItem
            item={diff}
            index={index}
            coverage={value}
            itemActionComponent={itemActionComponent}
            readOnly={readOnly}
            isPreview={forPreview}
            workflowStateReasonPrefix={`coverages[${coverageIndex}].scheduled_updates[${index}]`}
        />
    );

    const coverageTopBar = forPreview ? (
        <CoveragePreviewTopBar
            item={diff}
            coverage={value}
            users={users}
            desks={desks}
            newsCoverageStatus={newsCoverageStatus}
        />
    ) :
        (
            <CoverageFormHeader
                field={fieldName}
                value={value}
                onChange={onChange}
                users={users}
                desks={desks}
                readOnly={forPreview ? true : readOnly}
                addNewsItemToPlanning={addNewsItemToPlanning}
                onRemoveAssignment={!onRemoveAssignment ? null :
                    onRemoveAssignment.bind(null, coverage, coverageIndex, value, index)}
                setCoverageDefaultDesk={setCoverageDefaultDesk}
                {...props}
            />
        );

    const coverageStatus = get(value, 'news_coverage_status.qcode', '') ===
        PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode ? PLANNING.NEWS_COVERAGE_CANCELLED_STATUS :
        newsCoverageStatus.find((s) => s.qcode === get(value, 'news_coverage_status.qcode', '')) || {};

    const openItem = forPreview ? (
        <div>
            <PreviewRow label={assignmentUtils.getContactLabel(coverage)}>
                <ContactsPreviewList
                    contactIds={get(value, 'planning.contact_info.length', 0) > 0 ?
                        [value.planning.contact_info] : []}
                    scrollInView={true}
                    scrollIntoViewOptions={{block: 'center'}}
                />
            </PreviewRow>
            <PreviewRow
                label={gettext('Genre')}
                value={get(value, 'planning.genre.name')}
            />
            <PreviewRow
                label={gettext('Internal Note')}
                value={stringUtils.convertNewlineToBreak(
                    value.planning.internal_note || ''
                )}
            />
            <PreviewRow
                label={gettext('Coverage Status')}
                value={coverageStatus.label || ''}
            />
            <PreviewRow
                label={gettext('Due')}
                value={planningUtils.getCoverageDateText(value)}
            />
        </div>
    ) :
        (
            <ScheduledUpdateForm
                field={fieldName}
                value={value}
                diff={diff}
                index={index}
                coverageIndex={coverageIndex}
                onChange={onChange}
                newsCoverageStatus={newsCoverageStatus}
                contentTypes={contentTypes}
                genres={genres}
                readOnly={readOnly}
                invalid={componentInvalid}
                hasAssignment={planningUtils.isCoverageAssigned(value)}
                addNewsItemToPlanning={addNewsItemToPlanning}
                onFieldFocus={onFocus}
                onPopupOpen={onPopupOpen}
                onPopupClose={onPopupClose}
                onScheduleChanged={onScheduleChanged}
                {...props}
            />
        );

    return (
        <CollapseBox
            testId={testId}
            collapsedItem={coverageItem}
            openItem={openItem}
            openItemTopBar={coverageTopBar}
            tools={itemActionComponent}
            invalid={componentInvalid}
            onClose={onClose ? onClose.bind(null, value) : null}
            onOpen={onOpen ? onOpen.bind(null, value) : null}
            entityId={value.scheduled_update_id}
            isOpen={openScheduledUpdates.includes(value.scheduled_update_id)}
            tabEnabled
            scrollInView
        />
    );
};

ScheduledUpdate.propTypes = {
    testId: PropTypes.string,
    field: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    users: PropTypes.array,
    desks: PropTypes.array,
    newsCoverageStatus: PropTypes.array,
    onRemove: PropTypes.func,
    contentTypes: PropTypes.array,
    genres: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    readOnly: PropTypes.bool,
    item: PropTypes.object,
    diff: PropTypes.object,
    formProfile: PropTypes.object,
    addNewsItemToPlanning: PropTypes.object,
    onRemoveAssignment: PropTypes.func,
    index: PropTypes.number,
    popupContainer: PropTypes.func,
    setCoverageDefaultDesk: PropTypes.func,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    openCoverageIds: PropTypes.arrayOf(PropTypes.string),
    autoAssignToWorkflow: PropTypes.bool,
    onFocus: PropTypes.func,
    forPreview: PropTypes.bool,
    onScheduleChanged: PropTypes.func,
    coverageIndex: PropTypes.number,
    openScheduledUpdates: PropTypes.array,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    onAddScheduledUpdateToWorkflow: PropTypes.func,
    onCancelCoverage: PropTypes.func,
};

ScheduledUpdate.defaultProps = {
    openScheduledUpdates: [],
};
