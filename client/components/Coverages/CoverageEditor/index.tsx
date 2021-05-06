import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';

import {ItemActionsMenu} from '../../index';
import {CollapseBox} from '../../UI';
import {CoverageItem} from '../CoverageItem';
import {CoverageForm} from './CoverageForm';
import {CoverageFormHeader} from './CoverageFormHeader';

import {planningUtils, gettext, editorMenuUtils} from '../../../utils';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {COVERAGES} from '../../../constants';

export const CoverageEditor = ({
    diff,
    index,
    field,
    value,
    users,
    desks,
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
    onAddCoverageToWorkflow,
    onRemoveAssignment,
    readOnly,
    message,
    invalid,
    addNewsItemToPlanning,
    navigation,
    popupContainer,
    onPopupOpen,
    onPopupClose,
    setCoverageDefaultDesk,
    openCoverageIds,
    ...props
}) => {
    // Coverage item actions
    let itemActions = [];

    if (!readOnly && !addNewsItemToPlanning) {
        const language = getUserInterfaceLanguage();
        const duplicateActions = contentTypes
            .filter((contentType) => (
                contentType.qcode !== get(value, 'planning.g2_content_type')
            ))
            .map((contentType) => ({
                label: getVocabularyItemFieldTranslated(
                    contentType,
                    'name',
                    language
                ),
                callback: onDuplicateCoverage.bind(null, value, contentType.qcode),
            }));

        itemActions = [{
            label: gettext('Duplicate'),
            icon: 'icon-copy',
            callback: onDuplicateCoverage.bind(null, value),
        },
        {
            label: gettext('Duplicate As'),
            icon: 'icon-copy',
            callback: duplicateActions,
        }];

        if (planningUtils.canCancelCoverage(value, diff)) {
            itemActions.push({
                ...COVERAGES.ITEM_ACTIONS.CANCEL_COVERAGE,
                callback: onCancelCoverage.bind(null, value, index),
            });
        }

        if (planningUtils.canAddCoverageToWorkflow(value, diff)) {
            itemActions.push({
                id: 'addToWorkflow',
                label: gettext('Add to workflow'),
                icon: 'icon-assign',
                callback: onAddCoverageToWorkflow.bind(null, value, index),
            });
        }

        if (planningUtils.canRemoveCoverage(value, diff)) {
            itemActions.push({
                label: gettext('Remove coverage'),
                icon: 'icon-trash',
                callback: remove,
            });
        }
    }

    const onClose = editorMenuUtils.onItemClose(navigation, value.coverage_id);
    const onOpen = editorMenuUtils.onItemOpen(navigation, value.coverage_id);
    let scrollIntoView = true;

    if (get(navigation, 'scrollToViewItem') && navigation.scrollToViewItem !== value.coverage_id) {
        scrollIntoView = false;
    }

    const forceScroll = editorMenuUtils.forceScroll(navigation, value.coverage_id);
    const isOpen = editorMenuUtils.isOpen(navigation, value.coverage_id) || openCoverageIds.includes(value.coverage_id);
    const onFocus = editorMenuUtils.onItemFocus(navigation, value.coverage_id);

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

    const coverageItem = (
        <CoverageItem
            item={diff}
            index={index}
            coverage={value}
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
            readOnly={readOnly}
            addNewsItemToPlanning={addNewsItemToPlanning}
            onRemoveAssignment={onRemoveAssignment.bind(null, value, index)}
            setCoverageDefaultDesk={setCoverageDefaultDesk}
            {...props}
        />
    );

    const coverageForm = (
        <CoverageForm
            field={field}
            value={value}
            diff={diff}
            index={index}
            onChange={onChange}
            newsCoverageStatus={newsCoverageStatus}
            contentTypes={contentTypes}
            genres={genres}
            keywords={keywords}
            readOnly={readOnly}
            message={message}
            invalid={invalid}
            hasAssignment={planningUtils.isCoverageAssigned(value)}
            addNewsItemToPlanning={addNewsItemToPlanning}
            onFieldFocus={onFocus}
            onPopupOpen={onPopupOpen}
            onPopupClose={onPopupClose}
            onRemoveAssignment={onRemoveAssignment}
            setCoverageDefaultDesk={setCoverageDefaultDesk}
            users={users}
            desks={desks}
            coverageProviders={coverageProviders}
            priorities={priorities}
            onCancelCoverage={onCancelCoverage}
            {...props}
        />
    );

    return (
        <CollapseBox
            collapsedItem={coverageItem}
            tools={itemActionComponent}
            openItemTopBar={coverageTopBar}
            openItem={coverageForm}
            scrollInView={scrollIntoView}
            isOpen={isOpen}
            invalid={invalid}
            forceScroll={forceScroll}
            onClose={onClose}
            onOpen={onOpen}
            entityId={value.coverage_id}
            tabEnabled
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
    remove: PropTypes.func,
    contentTypes: PropTypes.array,
    genres: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    keywords: PropTypes.array,
    readOnly: PropTypes.bool,
    onDuplicateCoverage: PropTypes.func,
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
    invalid: PropTypes.bool,
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
};
