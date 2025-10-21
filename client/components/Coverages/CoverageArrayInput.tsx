import React from 'react';
import {connect} from 'react-redux';
import {isEmpty} from 'lodash';

import {
    EDITOR_TYPE,
    IAssignmentPriority,
    ICoverageProvider,
    ICoverageType,
    IEventItem,
    IFile,
    IG2ContentType,
    IGenre,
    IInputArrayHocModeOptions,
    IPlanningCoverageItem, IPlanningItem,
    IPlanningNewsCoverageStatus,
} from '../../interfaces';
import {IArticle, IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';

import {planningUtils} from '../../utils';
import * as selectors from '../../selectors';

import {InputArray} from '../UI/Form';
import {CoverageEditor, CoverageEditorComponent} from './CoverageEditor';
import {CoverageAddButton} from './CoverageAddButton';
import planningActions from '../../actions/planning/api';


interface IOwnProps {
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
    getRef?(field: string, value: IPlanningCoverageItem): React.RefObject<CoverageEditorComponent>;
    testId?: string;
    editorType: EDITOR_TYPE;

    // HOC mode - optional; added to support "add button" as mini toolbar in authoring-react
    children?: (options: IInputArrayHocModeOptions) => React.ReactNode;

    onChange(field: string, value: any): void;
    popupContainer(): HTMLElement;
    onPopupOpen(): void;
    onPopupClose(): void;
    createUploadLink(file: IFile): void;
    notifyValidationErrors(errors: Array<string>): void;
}

interface IReduxStateProps {
    users: Array<IUser>;
    desks: Array<IDesk>;
    genres: Array<IGenre>;
    coverageProviders: Array<ICoverageProvider>;
    priorities: Array<IAssignmentPriority>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    coverageAddAdvancedMode: boolean;
    defaultDesk: IDesk;
    getCoverageProfile: (coverageType?: ICoverageType) =>
        ReturnType<typeof selectors.coverageProfiles.getCoverageProfileByContentType>;
}

interface IReduxDispatchProps {
    uploadFiles(files: Array<Array<File>>): Promise<Array<IFile>>;
}

type IProps = IOwnProps & IReduxStateProps & IReduxDispatchProps;

interface IState {
    openCoverageIds: Array<IPlanningCoverageItem['coverage_id']>;
}

const mapStateToProps = (state): IReduxStateProps => ({
    getCoverageProfile: (contentType: ICoverageType) =>
        selectors.coverageProfiles.getCoverageProfileByContentType(state, contentType),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    genres: state.genres,
    coverageProviders: selectors.vocabs.coverageProviders(state),
    priorities: selectors.getAssignmentPriorities(state),
    contentTypes: selectors.general.contentTypes(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    coverageAddAdvancedMode: selectors.general.coverageAddAdvancedMode(state),
    defaultDesk: selectors.general.defaultDesk(state),
});

const mapDispatchToProps = (dispatch): IReduxDispatchProps => ({
    uploadFiles: (files) => dispatch(planningActions.uploadFiles({files: files})),
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
            item,
            navigation,
            useLocalNavigation,
            event,
            testId,
            editorType,
            children,
            ...props
        } = this.props;

        const coverageNavigation = !useLocalNavigation ? navigation : {
            onItemOpen: this.onCoverageOpen,
            onItemClose: this.onCoverageClose,
        };

        const createCoverage = planningUtils.defaultCoverageValues.bind(
            newsCoverageStatus,
            item,
            event,
            null,
            null,
            this.props.getCoverageProfile(),
        );

        const {desks, users, coverageAddAdvancedMode} = this.props;
        const language = this.props.item.language;

        return (
            <InputArray
                testId={testId}
                label={gettext('Coverages')}
                labelClassName="side-panel__heading side-panel__heading--big"
                field={field}
                value={value}
                coverages={value}
                onChange={onChange}
                addButtonText={addButtonText}
                addButtonComponent={CoverageAddButton}
                addButtonProps={{
                    contentTypes,
                    defaultDesk,
                    onPopupOpen,
                    onPopupClose,
                    newsCoverageStatus,
                    field,
                    value,
                    onChange,
                    createCoverage,
                    desks,
                    users,
                    coverageAddAdvancedMode,
                    language,
                    editorType,
                }}
                element={CoverageEditor}
                defaultElement={createCoverage}
                readOnly={readOnly}
                maxCount={maxCoverageCount}
                addOnly={addOnly}
                originalCount={originalCount}
                message={message}
                buttonWithLabel
                popupContainer={popupContainer}
                onPopupOpen={onPopupOpen}
                onPopupClose={onPopupClose}
                contentTypes={contentTypes}
                defaultDesk={defaultDesk}
                newsCoverageStatus={newsCoverageStatus}
                diff={item}
                navigation={coverageNavigation}
                openCoverageIds={this.state.openCoverageIds}
                getRef={this.props.getRef}
                editorType={editorType}
                {...props}
            >
                {children}
            </InputArray>
        );
    }
}

export const CoverageArrayInput = connect<IReduxStateProps, IReduxDispatchProps, IOwnProps>(
    mapStateToProps,
    mapDispatchToProps,
)(CoverageArrayInputComponent);
