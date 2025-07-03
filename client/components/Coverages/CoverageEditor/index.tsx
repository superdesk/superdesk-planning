import React from 'react';
import {get} from 'lodash';
import {connect} from 'react-redux';

import {
    EDITOR_TYPE,
    IAssignmentPriority,
    ICoverageProvider,
    IG2ContentType,
    IGenre,
    IPlanningAppState,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus
} from '../../../interfaces';
import {IArticle, IDesk, IUser} from 'superdesk-api';

import {ItemActionsMenu} from '../../index';
import {CollapseBox} from '../../UI';
import {CoverageItem} from '../CoverageItem';
import {CoverageForm} from './CoverageForm';
import {CoverageFormHeader} from './CoverageFormHeader';

import {planningUtils, gettext, editorMenuUtils} from '../../../utils';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';
import {getRelatedEventIdsForPlanning} from '../../../utils/planning';
import {planningApi} from '../../../superdeskApi';
import {planningApis} from '../../../api';
import * as selectors from '../../../selectors';

interface IOwnProps {
    testId?: string;
    field: string;
    value: IPlanningCoverageItem;

    /**
     * List of coverages that current coverage (`IProps['value']`) is a part of.
     * It is needed, because `IProps['onChange']` requires to pass all coverages
     * even if only a single one is being modified.
     */
    coverages: Array<IPlanningCoverageItem>;

    users: Array<IUser>;
    desks: Array<IDesk>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    contentTypes: Array<IG2ContentType>;
    coverageProviders: Array<ICoverageProvider>;
    priorities: Array<IAssignmentPriority>;
    readOnly: boolean;
    message: any;
    diff: any; // planning item
    formProfile: any;
    errors: {[key: string]: any};
    showErrors: boolean;
    invalid: boolean;
    addNewsItemToPlanning?: IArticle;
    navigation?: any;
    index: number;
    openCoverageIds: Array<IPlanningCoverageItem['coverage_id']>;
    includeScheduledUpdates?: boolean;
    editorType: EDITOR_TYPE;

    onChange(field: string, value: any): void;
    remove(): void;
    popupContainer(): void;
    onPopupOpen(): void;
    onPopupClose(): void;
}

interface IReduxStateProps {
    defaultDesk: IDesk | undefined;
}

type IProps = IOwnProps & IReduxStateProps;

function duplicateCoverage({
    planning,
    coverage,
    duplicateAs,
}: {
    planning: IPlanningItem;
    coverage: IPlanningCoverageItem;
    duplicateAs?: IG2ContentType['qcode'];
}): Array<DeepPartial<IPlanningCoverageItem>> {
    const state: IPlanningAppState = planningApi.redux.store.getState();

    // TAG: MULTIPLE_PRIMARY_EVENTS
    const relatedEventId = getRelatedEventIdsForPlanning(planning, 'primary')[0];

    const relatedEvent: IEventItem | undefined = relatedEventId == null
        ? undefined
        : state.events.events[relatedEventId];

    const coverages = planningUtils.duplicateCoverage(
        planning,
        coverage,
        duplicateAs,
        relatedEvent
    );

    return coverages;
}

function assignCoverageToDefaultDesk(coverage: DeepPartial<IPlanningCoverageItem>, defaultDesk: IDesk) {
    if (!Object.keys(coverage.assigned_to ?? {}).length) {
        coverage.assigned_to = {desk: defaultDesk._id};
    } else {
        const deskMembers = (defaultDesk?.members ?? []).map((m) => m.user);

        coverage.assigned_to.desk = defaultDesk._id;

        // If the user does not belong to default desk, remove the user
        if (coverage.assigned_to.user && !deskMembers.includes(coverage.assigned_to.user)) {
            coverage.assigned_to.user = null;
        }
    }
}

export class CoverageEditorComponent extends React.PureComponent<IProps> {
    private collapseBox: React.RefObject<CollapseBox>;

    constructor(props) {
        super(props);

        this.collapseBox = React.createRef<CollapseBox>();
        this.onChange = this.onChange.bind(this);
    }

    scrollInView() {
        this.collapseBox.current?.scrollInView(true);
    }

    private onChange(field, value) {
        let valueToUpdate = value;

        if (field.match(/^coverages\[/)) {
            const {newsCoverageStatus} = this.props;
            const coverage = value;

            // If there is an assignment and coverage status not planned,
            // change it to 'planned'
            if (newsCoverageStatus.length > 0 &&
                coverage?.news_coverage_status?.qcode !== newsCoverageStatus[0].qcode &&
                coverage?.assigned_to?.desk != null
            ) {
                valueToUpdate = {
                    ...coverage,
                    news_coverage_status: this.props.newsCoverageStatus[0],
                };
            }

            if (field.match(/g2_content_type$/) &&
                value === 'text' &&
                this.props.defaultDesk?._id != null
            ) {
                const coverageStr = field.substr(0, field.indexOf('.'));
                let existingCoverage: IPlanningCoverageItem = {...get(this.props, `diff.${coverageStr}`)};

                if (existingCoverage?.assigned_to?.desk !== this.props.defaultDesk._id) {
                    existingCoverage.planning.g2_content_type = value;
                    assignCoverageToDefaultDesk(existingCoverage, this.props.defaultDesk);
                    this.props.onChange(coverageStr, existingCoverage);
                    return;
                }
            }
        }

        this.props.onChange(field, valueToUpdate);
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
            newsCoverageStatus,
            coverageProviders,
            readOnly,
            message,
            invalid,
            addNewsItemToPlanning,
            navigation,
            popupContainer,
            onPopupOpen,
            onPopupClose,
            openCoverageIds,
            testId,
            includeScheduledUpdates,
            onChange: __unused, // destructure to avoid it being present in "...props"
            ...props
        } = this.props;

        const {onChange} = this;

        // Coverage item actions
        let itemActions = [];

        // `this.props.field` can be 'coverages[0]'
        const fieldOfArray = 'coverages';

        if (!readOnly && !addNewsItemToPlanning) {
            const language = value.planning?.language ?? getUserInterfaceLanguageFromCV();

            itemActions = [
                {
                    label: gettext('Duplicate'),
                    icon: 'icon-copy',
                    callback: () => {
                        onChange(
                            fieldOfArray,
                            duplicateCoverage({
                                planning: diff,
                                coverage: value,
                            }),
                        );
                    },
                },
                {
                    label: gettext('Duplicate As'),
                    icon: 'icon-copy',
                    callback: contentTypes
                        .filter((contentType) => (
                            contentType.qcode !== get(value, 'planning.g2_content_type')
                        ))
                        .map((contentType) => ({
                            label: getVocabularyItemFieldTranslated(
                                contentType,
                                'name',
                                language
                            ),
                            callback: () => {
                                onChange(
                                    fieldOfArray,
                                    duplicateCoverage({
                                        planning: diff,
                                        coverage: value,
                                        duplicateAs: contentType.qcode,
                                    }),
                                );
                            },
                        })),
                },
            ];

            if (planningUtils.canCancelCoverage(value, diff)) {
                itemActions.push({
                    label: gettext('Cancel coverage'),
                    icon: 'icon-close-small',
                    callback: () => {
                        planningApis.coverages.cancelCoverage(this.props.coverages, value)
                            .then((nextCoverages) => {
                                onChange(fieldOfArray, nextCoverages);
                            });
                    },
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

        const itemActionComponent = (itemActions ?? []).length > 0 && (
            <div className="side-panel__top-tools-right">
                <ItemActionsMenu
                    field={field}
                    actions={itemActions}
                    onOpen={onFocus}
                />
            </div>
        );

        const coverageItem = (
            <CoverageItem
                item={diff}
                index={index}
                coverage={value}
                itemActionComponent={itemActionComponent}
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
                readOnly={readOnly}
                message={message}
                hasAssignment={planningUtils.isCoverageAssigned(value)}
                addNewsItemToPlanning={addNewsItemToPlanning}
                onFieldFocus={onFocus}
                onPopupOpen={onPopupOpen}
                onPopupClose={onPopupClose}
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

function mapStateToProps(state: IPlanningAppState): IReduxStateProps {
    return {
        defaultDesk: selectors.general.defaultDesk(state),
    };
}


export const CoverageEditor = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(CoverageEditorComponent);
