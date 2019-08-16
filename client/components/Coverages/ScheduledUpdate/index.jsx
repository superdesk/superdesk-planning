import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {ItemActionsMenu} from '../../index';
import {CollapseBox} from '../../UI';
import {CoverageItem} from '../CoverageItem';
import {ScheduledUpdateForm} from './ScheduledUpdateForm';
import {CoverageFormHeader} from '../CoverageEditor/CoverageFormHeader';

import {planningUtils, gettext, editorMenuUtils} from '../../../utils';
import {COVERAGES} from '../../../constants';

export const ScheduledUpdate = ({
    diff,
    index,
    field,
    value,
    users,
    desks,
    dateFormat,
    timeFormat,
    remove,
    contentTypes,
    genres,
    newsCoverageStatus,
    onChange,
    coverageProviders,
    priorities,
    keywords,
    onCancelCoverage,
    onAddCoverageToWorkflow,
    onRemoveAssignment,
    readOnly,
    message,
    defaultGenre,
    addNewsItemToPlanning,
    navigation,
    popupContainer,
    onPopupOpen,
    onPopupClose,
    setCoverageDefaultDesk,
    openCoverageIds,
    autoAssignToWorkflow,
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
                callback: remove,
            });
        }
    }

    const onClose = editorMenuUtils.onItemClose(navigation, value.scheduled_update_id);
    const onOpen = editorMenuUtils.onItemOpen(navigation, value.scheduled_update_id);
    let scrollIntoView = true;

    if (get(navigation, 'scrollToViewItem') && navigation.scrollToViewItem !== value.scheduled_update_id) {
        scrollIntoView = false;
    }

    const forceScroll = editorMenuUtils.forceScroll(navigation, value.coverage_id);
    const isOpen = editorMenuUtils.isOpen(navigation, value.coverage_id) || openCoverageIds.includes(value.coverage_id);
    const onFocus = editorMenuUtils.onItemFocus(navigation, value.coverage_id);
    const componentInvalid = get(message, `scheduled_updates.${index}`)

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
    const fieldName = `${field}.scheduled_updates[${index}]`

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
        />
    );

    const coverageTopBar = (
        <CoverageFormHeader
            field={fieldName}
            value={value}
            onChange={onChange}
            users={users}
            desks={desks}
            coverageProviders={coverageProviders}
            priorities={priorities}
            readOnly={readOnly}
            addNewsItemToPlanning={addNewsItemToPlanning}
            onRemoveAssignment={onRemoveAssignment.bind(null, value, index)}
            setCoverageDefaultDesk={setCoverageDefaultDesk}
            {...props}
        />
    );

    const scheduledUpdateForm = (
        <ScheduledUpdateForm
            field={fieldName}
            value={value}
            diff={diff}
            index={index}
            onChange={onChange}
            newsCoverageStatus={newsCoverageStatus}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
            contentTypes={contentTypes}
            genres={genres}
            keywords={keywords}
            readOnly={readOnly}
            message={message}
            invalid={componentInvalid}
            hasAssignment={planningUtils.isCoverageAssigned(value)}
            defaultGenre={defaultGenre}
            addNewsItemToPlanning={addNewsItemToPlanning}
            onFieldFocus={onFocus}
            onPopupOpen={onPopupOpen}
            onPopupClose={onPopupClose}
            {...props}
        />
    );

    return (
        <CollapseBox
            collapsedItem={coverageItem}
            openItem={scheduledUpdateForm}
            openItemTopBar={coverageTopBar}
            tools={itemActionComponent}
            scrollInView={scrollIntoView}
            isOpen={isOpen}
            invalid={componentInvalid}
            forceScroll={forceScroll}
            onClose={onClose}
            onOpen={onOpen}
            entityId={value.scheduled_update_id}
            tabEnabled
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
    remove: PropTypes.func,
    contentTypes: PropTypes.array,
    genres: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    keywords: PropTypes.array,
    readOnly: PropTypes.bool,
    onCancelCoverage: PropTypes.func,
    onAddCoverageToWorkflow: PropTypes.func,
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    item: PropTypes.object,
    diff: PropTypes.object,
    formProfile: PropTypes.object,
    errors: PropTypes.object,
    showErrors: PropTypes.bool,
    defaultGenre: PropTypes.object,
    addNewsItemToPlanning: PropTypes.object,
    navigation: PropTypes.object,
    onRemoveAssignment: PropTypes.func,
    index: PropTypes.number,
    openCoverageIndex: PropTypes.number,
    popupContainer: PropTypes.func,
    setCoverageDefaultDesk: PropTypes.func,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    openCoverageIds: PropTypes.arrayOf(PropTypes.string),
    autoAssignToWorkflow: PropTypes.bool,
};

ScheduledUpdate.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
};
