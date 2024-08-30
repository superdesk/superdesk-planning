import * as React from 'react';
import {connect} from 'react-redux';
import {cloneDeep, isEqual} from 'lodash';

import {IIgnoreCancelSaveResponse} from 'superdesk-api';
import {
    IEditorProfile,
    IEditorProfileGroup,
    IPlanningContentProfile,
    IG2ContentType,
} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {getLanguages} from '../../../selectors/vocabs';

import {
    sortProfileGroups,
    getProfileGroupsSorted,
    getEnabledProfileGroupFields,
    getProfileGroupNameTranslated,
} from '../../../utils/contentProfiles';

import {Alert} from 'superdesk-ui-framework/react';
import {GroupList} from './GroupList';
import {GroupEditor} from './GroupEditor';

interface IProps {
    profile: IPlanningContentProfile;
    languages: Array<IG2ContentType>;
    updateGroup(group: IEditorProfileGroup): void;
    updateGroups(groups: IPlanningContentProfile['groups']): void;
    deleteGroup(group: IEditorProfileGroup): void;
}

interface IState {
    selectedGroup?: IEditorProfileGroup;
    creatingNewGroup: boolean;
    errors: {[key: string]: string};
}

const mapStateToProps = (state) => ({
    languages: getLanguages(state),
});

export class GroupTabComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            selectedGroup: undefined,
            creatingNewGroup: false,
            errors: {},
        };

        this.openEditor = this.openEditor.bind(this);
        this.updateGroupAttribute = this.updateGroupAttribute.bind(this);
        this.updateGroupTranslation = this.updateGroupTranslation.bind(this);
        this.closeEditor = this.closeEditor.bind(this);
        this.saveGroup = this.saveGroup.bind(this);
        this.updateGroup = this.updateGroup.bind(this);
        this.updateGroupOrder = this.updateGroupOrder.bind(this);
        this.insertGroup = this.insertGroup.bind(this);
        this.removeGroup = this.removeGroup.bind(this);
    }

    openEditor(group: IEditorProfileGroup, isNewGroup: boolean = false) {
        if (group._id !== this.state.selectedGroup?._id) {
            this.closeEditor().then((response) => {
                if (response !== 'cancel') {
                    this.setState({
                        selectedGroup: cloneDeep(group),
                        creatingNewGroup: isNewGroup,
                        errors: {},
                    });
                }
            });
        }
    }

    updateGroupAttribute(field: string, value: string | boolean) {
        this.setState((prevState: Readonly<IState>) => ({
            selectedGroup: {
                ...prevState.selectedGroup,
                [field]: value,
            },
        }));
    }

    updateGroupTranslation(languageQcode: IG2ContentType['qcode'], translatedName: string) {
        this.setState((prevState: Readonly<IState>) => ({
            selectedGroup: {
                ...prevState.selectedGroup,
                translations: {
                    ...prevState.selectedGroup.translations,
                    name: {
                        ...prevState.selectedGroup.translations.name,
                        [languageQcode]: translatedName,
                    },
                },
            },
        }));
    }

    isEditorDirty() {
        if (this.state.selectedGroup != null) {
            /**
             * If a new group is being created, its not in this.props.profile.groups,
             * making the next checks unnecessary. Regardless of that, if this is the case,
             * there's no need to check further.
             */
            if (this.state.creatingNewGroup) {
                return true;
            }

            const originalGroup = this.props.profile.groups[this.state.selectedGroup._id];
            const updatedGroup = {
                ...this.state.selectedGroup,
                index: originalGroup.index,
            };

            return !isEqual(
                originalGroup,
                updatedGroup
            );
        }

        return false;
    }

    closeEditor(disableSave?: boolean): Promise<IIgnoreCancelSaveResponse> {
        const close = () => {
            if (this.state.creatingNewGroup) {
                this.props.deleteGroup(this.state.selectedGroup);
            }

            this.setState({
                selectedGroup: undefined,
                creatingNewGroup: false,
                errors: {},
            });
        };

        if (this.isEditorDirty()) {
            const {gettext} = superdeskApi.localization;
            const {showIgnoreCancelSaveDialog} = superdeskApi.ui;
            const errors = this.validateCurrentGroup();
            const valid = !Object.keys(errors).length;

            if (!valid) {
                this.setState({errors});
            }

            return showIgnoreCancelSaveDialog(!valid ?
                {
                    title: gettext('Ignore changes?'),
                    hideSave: true,
                    body: (
                        <Alert
                            style="hollow"
                            size="normal"
                            type="warning"
                        >
                            {gettext('There are unsaved changes, but the form is invalid')}
                        </Alert>
                    ),
                } : {
                    title: disableSave ?
                        gettext('Ignore changes?') :
                        gettext('Save changes?'),
                    body: gettext('There are unsaved changes.'),
                    hideSave: disableSave,
                }
            ).then((response) => {
                if (response === 'ignore') {
                    close();
                } else if (response === 'save') {
                    this.saveGroup();
                    close();
                }

                return response;
            });
        } else {
            close();
            return Promise.resolve('ignore');
        }
    }

    validateCurrentGroup() {
        const {gettext} = superdeskApi.localization;
        const errors: IState['errors'] = {};
        const group = this.state.selectedGroup;

        if (group == null) {
            return errors;
        }

        if (!(group.name ?? '').trim().length) {
            errors.name = gettext('"Name" is a required field');
        }

        this.props.languages.forEach((language) => {
            if (!(group.translations.name[language.qcode] ?? '').trim().length) {
                errors[`translations.name.${language.qcode}`] = gettext(
                    '"{{language}}" translation is required',
                    {language: language.name}
                );
            }
        });

        return errors;
    }

    saveGroup() {
        const {notify} = superdeskApi.ui;
        const errors = this.validateCurrentGroup();

        if (Object.keys(errors).length) {
            notify.error('Failed to save group');
        } else {
            const group = this.state.selectedGroup;
            // Make sure to not change the current index of this field
            // otherwise the group order may change on save
            const currentIndex = this.props.profile.groups[group._id].index;

            this.updateGroup({
                ...group,
                index: currentIndex,
            });
        }

        this.setState({errors});
    }

    updateGroup(group: IEditorProfileGroup) {
        this.props.updateGroup(group);
        this.setState({
            selectedGroup: undefined,
            creatingNewGroup: false,
        });
    }

    updateGroups(groups: IEditorProfile['groups']) {
        const profile = {...this.props.profile};

        profile.groups = groups;
        sortProfileGroups(profile);

        this.props.updateGroups(profile.groups);
    }

    updateGroupOrder(groups: Array<IEditorProfileGroup>) {
        const profile = {...this.props.profile};

        groups.forEach((group, index) => {
            profile.groups[group._id].index = index;
        });

        this.props.updateGroups(profile.groups);
    }

    insertGroup(index: number) {
        const profile = {...this.props.profile};
        const numNewGroups = Object.keys(profile.groups)
            .filter((groupId) => profile.groups[groupId]._id.startsWith('new_group_'))
            .length;
        const groupId = `new_group_${numNewGroups + 1}`;

        profile.groups[groupId] = {
            _id: groupId,
            name: `New Group ${numNewGroups + 1}`,
            icon: '',
            useToggleBox: false,
            showBookmark: false,
            index: index,
            translations: {
                name: {},
            },
        };

        sortProfileGroups(profile);
        this.props.updateGroups(profile.groups);
        setTimeout(() => {
            this.openEditor(
                this.props.profile.groups[groupId],
                true
            );
        });
    }

    removeGroup(group: IEditorProfileGroup) {
        const {gettext} = superdeskApi.localization;
        const {confirm} = superdeskApi.ui;
        const groupFields = getEnabledProfileGroupFields(this.props.profile, group._id);

        confirm(
            groupFields.length ?
                gettext('This will also remove all fields for this group. Delete anyway?') :
                gettext('Are you sure you want to delete this group'),
            gettext('Delete Group "{{group}}"?', {
                group: getProfileGroupNameTranslated(group),
            })
        ).then((response) => {
            if (response) {
                if (this.state.selectedGroup?._id === group._id) {
                    this.setState({
                        selectedGroup: undefined,
                        creatingNewGroup: false,
                    });
                }
                this.props.deleteGroup(group);
            }
        });
    }

    render() {
        return (
            <div className="sd-column-box--2">
                <div className="sd-column-box__main-column">
                    <GroupList
                        groups={getProfileGroupsSorted(this.props.profile)}
                        selectedGroup={this.state.selectedGroup}
                        onClick={this.openEditor}
                        onSortChange={this.updateGroupOrder}
                        insertGroup={this.insertGroup}
                        removeGroup={this.removeGroup}
                    />
                </div>
                {this.state.selectedGroup == null ? null : (
                    <GroupEditor
                        key={this.state.selectedGroup._id}
                        profile={this.props.profile}
                        group={this.state.selectedGroup}
                        isNewGroup={this.state.creatingNewGroup}
                        languages={this.props.languages}
                        errors={this.state.errors}
                        isDirty={this.isEditorDirty()}
                        onCancel={this.closeEditor}
                        saveGroup={this.saveGroup}
                        updateGroupAttribute={this.updateGroupAttribute}
                        updateGroupTranslation={this.updateGroupTranslation}
                    />
                )}
            </div>
        );
    }
}

export const GroupTab = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(GroupTabComponent);
