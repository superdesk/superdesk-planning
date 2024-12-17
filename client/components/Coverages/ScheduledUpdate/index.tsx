import React from 'react';
import {get} from 'lodash';
import moment from 'moment';

import {IArticle, IDesk, IUser} from 'superdesk-api';
import {
    IAssignmentPriority,
    ICoverageProvider, ICoverageScheduledUpdate,
    IGenre,
    IPlanningCoverageItem,
    IPlanningItem,
    IPlanningNewsCoverageStatus
} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {ContactsPreviewList} from '../../Contacts';
import {Row as PreviewRow} from '../../UI/Preview';
import {ItemActionsMenu} from '../../index';
import {CollapseBox} from '../../UI';
import {CoverageItem} from '../CoverageItem';
import {ScheduledUpdateForm} from './ScheduledUpdateForm';
import {CoverageFormHeader} from '../CoverageEditor/CoverageFormHeader';
import {CoveragePreviewTopBar} from '../CoveragePreview/CoveragePreviewTopBar';

import {planningUtils, stringUtils, assignmentUtils} from '../../../utils';
import {PLANNING} from '../../../constants';
import {planningApis} from '../../../api';

interface IProps {
    diff: IPlanningCoverageItem;
    planning: IPlanningItem;
    scheduledUpdates: Array<ICoverageScheduledUpdate>;
    index: number;
    field: string;
    value: ICoverageScheduledUpdate;
    users: Array<IUser>;
    desks: Array<IDesk>;
    genres: Array<IGenre>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    coverageProviders: Array<ICoverageProvider>;
    priorities: Array<IAssignmentPriority>;
    readOnly: boolean;
    addNewsItemToPlanning?: IArticle;
    openCoverageIds: Array<IPlanningCoverageItem['coverage_id']>;
    autoAssignToWorkflow: boolean;
    forPreview: boolean;
    coverageIndex: number;
    openScheduledUpdates: Array<ICoverageScheduledUpdate['scheduled_update_id']>;
    message: {[key: string]: string};
    testId: string;

    onRemove(): void;
    onChange(field: string, value: any): void
    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
    onFocus?(): void;
    onScheduleChanged(field: string, value: moment.Moment | undefined, coverage: ICoverageScheduledUpdate): void;
    onOpen?(coverage: ICoverageScheduledUpdate): void;
    onClose?(coverage: ICoverageScheduledUpdate): void;
    onCancelScheduledUpdate?(): void;
}

export class ScheduledUpdate extends React.PureComponent<IProps> {
    static defaultProps = {
        openScheduledUpdates: [],
    };

    constructor(props: IProps) {
        super(props);

        this.onOpen = this.onOpen.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    onOpen() {
        this.props.onOpen(this.props.value);
    }

    onClose() {
        this.props.onClose(this.props.value);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            diff,
            planning,
            index,
            field,
            value,
            users,
            desks,
            onRemove,
            genres,
            newsCoverageStatus,
            onChange,
            coverageProviders,
            priorities,
            readOnly,
            addNewsItemToPlanning,
            popupContainer,
            onPopupOpen,
            onPopupClose,
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
            testId,
            ...props
        } = this.props;

        // Coverage item actions
        let itemActions = [];

        if (!readOnly && !addNewsItemToPlanning) {
            // To be done in the next iteration
            if (planningUtils.canCancelCoverage(value, planning, 'scheduled_update_id')) {
                itemActions.push({
                    label: gettext('Cancel Scheduled Update'),
                    icon: 'icon-close-small',
                    callback: () => {
                        this.props.onCancelScheduledUpdate();
                    },
                });
            }

            if (planningUtils.canAddScheduledUpdateToWorkflow(value, autoAssignToWorkflow, planning, diff)) {
                itemActions.push({
                    id: 'addToWorkflow',
                    label: gettext('Add to workflow'),
                    icon: 'icon-assign',
                    callback: () => {
                        this.props.onChange(
                            'scheduled_updates',
                            planningApis.planning.coverages.addScheduledUpdateToWorkflow(
                                this.props.scheduledUpdates,
                                this.props.value,
                            ),
                        );
                    },
                });
            }

            if (planningUtils.canRemoveCoverage(value, planning)) {
                itemActions.push({
                    label: gettext('Remove Scheduled Update'),
                    icon: 'icon-trash',
                    callback: onRemove,
                });
            }
        }

        const componentInvalid = get(message, `scheduled_updates.${index}`)?.length > 0;
        const itemActionComponent = itemActions.length > 0 ?
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
        const fieldName = `scheduled_updates[${index}]`;

        const coverageItem = (
            <CoverageItem
                item={planning}
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
                item={planning}
                coverage={value}
                users={users}
                desks={desks}
                newsCoverageStatus={newsCoverageStatus}
            />
        ) : (
            <CoverageFormHeader
                field={fieldName}
                value={value}
                onChange={onChange}
                users={users}
                desks={desks}
                readOnly={readOnly}
                addNewsItemToPlanning={addNewsItemToPlanning}
            />
        );

        const coverageStatus = get(value, 'news_coverage_status.qcode', '') ===
        PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode ? PLANNING.NEWS_COVERAGE_CANCELLED_STATUS :
            newsCoverageStatus.find((s) => s.qcode === get(value, 'news_coverage_status.qcode', '')) || {};

        const openItem = forPreview ? (
            <div>
                <PreviewRow label={assignmentUtils.getContactLabel(value)}>
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
        ) : (
            <ScheduledUpdateForm
                field={fieldName}
                value={value}
                diff={diff}
                index={index}
                coverageIndex={coverageIndex}
                newsCoverageStatus={newsCoverageStatus}
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
                onChange={onChange}
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
                onClose={onClose ? this.onClose : null}
                onOpen={onOpen ? this.onOpen : null}
                entityId={value.scheduled_update_id}
                isOpen={openScheduledUpdates.includes(value.scheduled_update_id)}
                tabEnabled
                scrollInView
            />
        );
    }
}
