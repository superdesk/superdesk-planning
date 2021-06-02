import React from 'react';
import {connect} from 'react-redux';
import {isEmpty} from 'lodash';

import {ContentBlock} from '../UI/SidePanel';
import {InputArray} from '../UI/Form';
import {CoverageEditor} from './CoverageEditor';
import {CoverageAddButton} from './CoverageAddButton';

import {planningUtils} from '../../utils';
import {
    IAssignmentPriority,
    ICoverageFormProfile,
    ICoverageProvider, ICoverageScheduledUpdate, IEventItem, IFile,
    IG2ContentType,
    IGenre,
    IKeyword,
    IPlanningCoverageItem, IPlanningItem,
    IPlanningNewsCoverageStatus,
} from '../../interfaces';
import {IArticle, IDesk, IUser} from 'superdesk-api';
import * as selectors from '../../selectors';
import {superdeskApi} from '../../superdeskApi';

interface IProps {
    field: string;
    addButtonText?: string; // defaults to 'Add a coverage'
    item: IPlanningItem;
    value: Array<IPlanningCoverageItem>;
    readOnly: boolean;
    addNewsItemToPlanning?: IArticle;
    useLocalNavigation?: boolean;
    navigation?: any;
    maxCoverageCount?: number;
    addOnly?: boolean;
    originalCount?: number;
    message: string | {[key: string]: any};
    event?: IEventItem;
    preferredCoverageDesks: {[key: string]: string};
    getRef?(field: string, value: IPlanningCoverageItem): React.RefObject<CoverageEditor>;
    testId?: string;

    // Redux state
    users: Array<IUser>;
    desks: Array<IDesk>;
    genres: Array<IGenre>;
    coverageProviders: Array<ICoverageProvider>;
    priorities: Array<IAssignmentPriority>;
    keywords: Array<IKeyword>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    formProfile: ICoverageFormProfile;
    planningAllowScheduledUpdates: boolean;
    coverageAddAdvancedMode: boolean;
    defaultDesk: IDesk;

    onChange(field: string, value: any): void;
    popupContainer(): HTMLElement;
    onPopupOpen(): void;
    onPopupClose(): void;
    setCoverageDefaultDesk(coverage: IPlanningCoverageItem): void;
    setCoverageAddAdvancedMode(enabled: boolean): Promise<void>;
    createUploadLink(file: IFile): void;
    onDuplicateCoverage(coverage: IPlanningCoverageItem, duplicateAs: IG2ContentType['qcode']): void;
    onCancelCoverage(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate?: ICoverageScheduledUpdate,
        scheduledUpdateIndex?: number,
    ): void;
    onAddCoverageToWorkflow(coverage: IPlanningCoverageItem, index: number): void;
    onAddScheduledUpdateToWorkflow(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate?: ICoverageScheduledUpdate,
        scheduledUpdateIndex?: number
    ): void;
    onRemoveAssignment(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate?: ICoverageScheduledUpdate,
        scheduledUpdateIndex?: number
    ): void;
    uploadFiles(files: Array<Array<File>>): Promise<Array<IFile>>;
    notifyValidationErrors(errors: Array<string>): void;
}

interface IState {
    openCoverageIds: Array<IPlanningCoverageItem['coverage_id']>;
}

const mapStateToProps = (state) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    genres: state.genres,
    coverageProviders: selectors.vocabs.coverageProviders(state),
    priorities: selectors.getAssignmentPriorities(state),
    contentTypes: selectors.general.contentTypes(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    formProfile: selectors.forms.coverageProfile(state),
    planningAllowScheduledUpdates: selectors.forms.getPlanningAllowScheduledUpdates(state),
    coverageAddAdvancedMode: selectors.general.coverageAddAdvancedMode(state),
    defaultDesk: selectors.general.defaultDesk(state),
});

class CoverageArrayInputComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {openCoverageIds: []};

        this.onCoverageClose = this.onCoverageClose.bind(this);
        this.onCoverageOpen = this.onCoverageOpen.bind(this);
    }

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>, snapshot?: any) {
        if (isEmpty(prevProps.item)) {
            // Autosave loading in progress
            return;
        }

        const currentCount = this.props.value?.length ?? 0;
        const prevCount = prevProps.value?.length ?? 0;

        if (currentCount > prevCount &&
            (!this.props.readOnly || this.props.addNewsItemToPlanning != null) &&
            currentCount - prevCount === 1
        ) {
            const coverageId = this.props.value[this.props.value.length - 1].coverage_id;
            // A single coverage was just added, mark it to be opened in the editor

            if (!this.props.useLocalNavigation && this.props.navigation?.onItemOpen != null) {
                this.props.navigation.onItemOpen(coverageId);
            } else {
                this.onCoverageOpen(coverageId);
            }
        }
    }

    onCoverageOpen(coverageId) {
        if (!this.state.openCoverageIds.includes(coverageId)) {
            this.setState({
                openCoverageIds: [
                    ...this.state.openCoverageIds,
                    coverageId,
                ],
            });
        }
    }

    onCoverageClose(coverageId) {
        if (this.state.openCoverageIds.includes(coverageId)) {
            this.setState({
                openCoverageIds: this.state.openCoverageIds.filter(
                    (c) => c !== coverageId
                ),
            });
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            field = 'coverages',
            value,
            onChange,
            addButtonText = gettext('Add a coverage'),
            defaultDesk,
            contentTypes,
            newsCoverageStatus,
            maxCoverageCount = 0,
            addOnly,
            originalCount,
            readOnly,
            message,
            popupContainer,
            onPopupOpen,
            onPopupClose,
            setCoverageDefaultDesk,
            preferredCoverageDesks,
            item,
            navigation,
            useLocalNavigation,
            event,
            testId,
            ...props
        } = this.props;

        const coverageNavigation = !useLocalNavigation ? navigation : {
            onItemOpen: this.onCoverageOpen,
            onItemClose: this.onCoverageClose,
        };

        const createCoverage = planningUtils.defaultCoverageValues.bind(
            null,
            newsCoverageStatus,
            item,
            event
        );

        const {desks, users, coverageAddAdvancedMode, setCoverageAddAdvancedMode} = this.props;
        const language = this.props.item.language;

        return (
            <InputArray
                testId={testId}
                label={gettext('Coverages')}
                labelClassName="side-panel__heading side-panel__heading--big"
                field={field}
                value={value}
                onChange={onChange}
                addButtonText={addButtonText}
                addButtonComponent={CoverageAddButton}
                addButtonProps={{
                    contentTypes,
                    defaultDesk,
                    onPopupOpen,
                    onPopupClose,
                    preferredCoverageDesks,
                    newsCoverageStatus,
                    field,
                    value,
                    onChange,
                    createCoverage,
                    desks,
                    users,
                    coverageAddAdvancedMode,
                    setCoverageAddAdvancedMode,
                    language,
                }}
                element={CoverageEditor}
                defaultElement={createCoverage}
                readOnly={readOnly}
                maxCount={maxCoverageCount}
                addOnly={addOnly}
                originalCount={originalCount}
                message={message}
                row={false}
                buttonWithLabel
                popupContainer={popupContainer}
                onPopupOpen={onPopupOpen}
                onPopupClose={onPopupClose}
                setCoverageDefaultDesk={setCoverageDefaultDesk}
                contentTypes={contentTypes}
                defaultDesk={defaultDesk}
                newsCoverageStatus={newsCoverageStatus}
                diff={item}
                navigation={coverageNavigation}
                openCoverageIds={this.state.openCoverageIds}
                preferredCoverageDesks={preferredCoverageDesks}
                getRef={this.props.getRef}
                {...props}
            />
        );
    }
}

export const CoverageArrayInput = connect(mapStateToProps)(CoverageArrayInputComponent);
