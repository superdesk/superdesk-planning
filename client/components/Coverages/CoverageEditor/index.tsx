import React from 'react';
import {get} from 'lodash';

import {
    IAssignmentPriority,
    ICoverageProvider,
    IG2ContentType,
    IGenre,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus
} from '../../../interfaces';
import {IArticle, IDesk, IUser} from 'superdesk-api';
import {getUserInterfaceLanguage} from 'appConfig';

import {ItemActionsMenu} from '../../index';
import {CollapseBox} from '../../UI';
import {CoverageItem} from '../CoverageItem';
import {CoverageForm} from './CoverageForm';
import {CoverageFormHeader} from './CoverageFormHeader';

import {planningUtils, gettext, editorMenuUtils} from '../../../utils';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {COVERAGES} from '../../../constants';

interface IProps {
    testId?: string;
    field: string;
    value: IPlanningCoverageItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    contentTypes: Array<IG2ContentType>;
    genres: Array<IGenre>;
    coverageProviders: Array<ICoverageProvider>;
    priorities: Array<IAssignmentPriority>;
    keywords: Array<string>;
    readOnly: boolean;
    message: any;
    item: any;
    diff: any;
    formProfile: any;
    errors: {[key: string]: any};
    showErrors: boolean;
    invalid: boolean;
    addNewsItemToPlanning?: IArticle;
    navigation?: any;
    index: number;
    openCoverageIndex: number;
    openCoverageIds: Array<IPlanningCoverageItem['coverage_id']>;
    includeScheduledUpdates?: boolean;

    onChange(field: string, value: any): void;
    remove(): void;
    onDuplicateCoverage(coverage: DeepPartial<IPlanningCoverageItem>, duplicateAs?: IG2ContentType['qcode']): void;
    onCancelCoverage?(): void;
    onAddCoverageToWorkflow?(): void;
    onRemoveAssignment?(): void;
    popupContainer(): void;
    setCoverageDefaultDesk(): void;
    onPopupOpen(): void;
    onPopupClose(): void;
}

export class CoverageEditor extends React.PureComponent<IProps> {
    collapseBox: React.RefObject<CollapseBox>;

    constructor(props) {
        super(props);

        this.collapseBox = React.createRef<CollapseBox>();
    }

    scrollInView() {
        this.collapseBox.current?.scrollInView(true);
    }

    render() {
        const {
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
            testId,
            includeScheduledUpdates,
            ...props
        } = this.props;

        // Coverage item actions
        let itemActions = [];

        if (!readOnly && !addNewsItemToPlanning) {
            const language = value.planning?.language ?? getUserInterfaceLanguage();
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

            if (onCancelCoverage != null && planningUtils.canCancelCoverage(value, diff)) {
                itemActions.push({
                    ...COVERAGES.ITEM_ACTIONS.CANCEL_COVERAGE,
                    callback: onCancelCoverage.bind(null, value, index),
                });
            }

            if (onAddCoverageToWorkflow != null && planningUtils.canAddCoverageToWorkflow(value, diff)) {
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
        const isOpen = editorMenuUtils.isOpen(navigation, value.coverage_id) ||
            openCoverageIds.includes(value.coverage_id);
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
                onRemoveAssignment={onRemoveAssignment && onRemoveAssignment.bind(null, value, index)}
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
                includeScheduledUpdates={includeScheduledUpdates}
                {...props}
            />
        );

        return (
            <CollapseBox
                testId={testId}
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
                tabEnabled={true}
                ref={this.collapseBox}
                scrollIntoViewOptions={{behavior: 'smooth'}}
            />
        );
    }
}
