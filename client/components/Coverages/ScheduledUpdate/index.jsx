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

import {planningUtils, gettext, stringUtils} from '../../../utils';
import {PLANNING} from '../../../constants';

export const ScheduledUpdate = ({
    diff,
    index,
    field,
    value,
    users,
    desks,
    dateFormat,
    timeFormat,
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
    ...props
}) => {
    // Coverage item actions
    let itemActions = [];

    if (!readOnly && !addNewsItemToPlanning) {
        // To be done in the next iteration
        /* if (planningUtils.canCancelCoverage(value)) {
            itemActions.push({
                ...COVERAGES.ITEM_ACTIONS.CANCEL_COVERAGE,
                callback: onCancelCoverage.bind(null, value),
            });
        }

        if (planningUtils.canAddCoverageToWorkflow(value, autoAssignToWorkflow)) {
            itemActions.push({
                id: 'addToWorkflow',
                label: gettext('Add to workflow'),
                icon: 'icon-assign',
                callback: onAddCoverageToWorkflow.bind(null, value, index),
            });
        } */

        if (planningUtils.canRemoveCoverage(value, diff)) {
            itemActions.push({
                label: gettext('Remove coverage'),
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
            users={users}
            desks={desks}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
            contentTypes={contentTypes}
            itemActionComponent={itemActionComponent}
            readOnly={readOnly}
            isPreview={forPreview}
        />
    );

    const coverageTopBar = forPreview ? (<CoveragePreviewTopBar
        item={diff}
        coverage={value}
        users={users}
        desks={desks}
        newsCoverageStatus={newsCoverageStatus}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
    />) :
        (<CoverageFormHeader
            field={fieldName}
            value={value}
            onChange={onChange}
            users={users}
            desks={desks}
            coverageProviders={coverageProviders}
            priorities={priorities}
            readOnly={forPreview ? true : readOnly}
            addNewsItemToPlanning={addNewsItemToPlanning}
            onRemoveAssignment={onRemoveAssignment ? onRemoveAssignment.bind(null, value, index) : null}
            setCoverageDefaultDesk={setCoverageDefaultDesk}
            {...props}
        />
        );

    const coverageStatus = get(value, 'news_coverage_status.qcode', '') ===
        PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode ? PLANNING.NEWS_COVERAGE_CANCELLED_STATUS :
        newsCoverageStatus.find((s) => s.qcode === get(value, 'news_coverage_status.qcode', '')) || {};

    const openItem = forPreview ? (<div>
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
        <PreviewRow label={gettext('Coverage Provider Contact')}>
            <ContactsPreviewList
                contactIds={get(value, 'planning.contact_info.length', 0) > 0 ?
                    [value.planning.contact_info] : []}
                scrollInView={true}
                scrollIntoViewOptions={{block: 'center'}}
            />
        </PreviewRow>
        <PreviewRow
            label={gettext('Coverage Status')}
            value={coverageStatus.label || ''}
        />
        <PreviewRow
            label={gettext('Due')}
            value={planningUtils.getCoverageDateText(value, dateFormat, timeFormat)}
        />
    </div>) :
        (<ScheduledUpdateForm
            field={fieldName}
            value={value}
            diff={diff}
            index={index}
            coverageIndex={coverageIndex}
            onChange={onChange}
            newsCoverageStatus={newsCoverageStatus}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
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
        />);

    return (
        <CollapseBox
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
    field: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    users: PropTypes.array,
    desks: PropTypes.array,
    newsCoverageStatus: PropTypes.array,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
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
    coverageIndex: PropTypes.string,
    openScheduledUpdates: PropTypes.array,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
};

ScheduledUpdate.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    openScheduledUpdates: [],
};
