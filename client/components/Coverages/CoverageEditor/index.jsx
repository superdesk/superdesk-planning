import React from 'react';
import PropTypes from 'prop-types';
import {isEqual, get} from 'lodash';

import {ItemActionsMenu} from '../../index';
import {CollapseBox} from '../../UI';
import {CoverageItem} from '../CoverageItem';
import {CoverageForm} from './CoverageForm';
import {CoverageFormHeader} from './CoverageFormHeader';

import {planningUtils, gettext, editorMenuUtils} from '../../../utils';

export const CoverageEditor = ({
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
    onDuplicateCoverage,
    onCancelCoverage,
    onAddCoverageToWorkflow,
    onRemoveAssignment,
    readOnly,
    message,
    invalid,
    openComponent,
    defaultGenre,
    addNewsItemToPlanning,
    navigation,
    ...props
}) => {
    // Coverage item actions
    let itemActions = [];

    if (!readOnly && !addNewsItemToPlanning) {
        const duplicateActions = contentTypes
            .filter((contentType) => (
                contentType.qcode !== get(value, 'planning.g2_content_type')
            ))
            .map((contentType) => ({
                label: contentType.name,
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

        if (value.coverage_id) {
            if (planningUtils.canCancelCoverage(value)) {
                itemActions.push({
                    label: gettext('Cancel coverage'),
                    icon: 'icon-close-small',
                    callback: onCancelCoverage.bind(null, value),
                });
            }

            if (planningUtils.isCoverageDraft(value) && planningUtils.isCoverageAssigned(value)) {
                itemActions.push({
                    label: gettext('Add to workflow'),
                    icon: 'icon-assign',
                    callback: onAddCoverageToWorkflow.bind(null, value, index),
                });
            }
        }

        if (planningUtils.canRemoveCoverage(value)) {
            itemActions.push({
                label: gettext('Remove coverage'),
                icon: 'icon-trash',
                callback: remove,
            });
        }
    }

    const onClose = editorMenuUtils.onItemClose(navigation, field);
    const onOpen = editorMenuUtils.onItemOpen(navigation, field);
    const forceScroll = editorMenuUtils.forceScroll(navigation, field);
    const isOpen = editorMenuUtils.isOpen(navigation, field) || (
        openComponent ||
        !props.item._id ||
        isEqual(
            value,
            planningUtils.defaultCoverageValues(
                newsCoverageStatus,
                props.item,
                get(value, 'planning.g2_content_type')
            )
        )
    );
    const onFocus = editorMenuUtils.onItemFocus(navigation, field);

    const itemActionComponent = get(itemActions, 'length', 0) > 0 ?
        (
            <div className="side-panel__top-tools-right">
                <ItemActionsMenu
                    actions={itemActions}
                    onOpen={onFocus}
                />
            </div>
        ) :
        null;

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
            addNewsItemToPlanning={addNewsItemToPlanning}
            onRemoveAssignment={onRemoveAssignment.bind(null, value, index)}
            {...props}
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
            message={message}
            invalid={invalid}
            hasAssignment={planningUtils.isCoverageAssigned(value)}
            defaultGenre={defaultGenre}
            addNewsItemToPlanning={addNewsItemToPlanning}
            onFieldFocus={onFocus}
            {...props}
        />
    );

    return (
        <CollapseBox
            collapsedItem={coverageItem}
            tools={itemActionComponent}
            openItemTopBar={coverageTopBar}
            openItem={coverageForm}
            scrollInView={true}
            isOpen={isOpen}
            invalid={invalid}
            forceScroll={forceScroll}
            onClose={onClose}
            onOpen={onOpen}
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
    openComponent: PropTypes.bool,
    defaultGenre: PropTypes.object,
    addNewsItemToPlanning: PropTypes.object,
    navigation: PropTypes.object,
    onRemoveAssignment: PropTypes.func,
    index: PropTypes.number,
};

CoverageEditor.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
};
