import * as React from 'react';
import {connect} from 'react-redux';
import {cloneDeep} from 'lodash';

import {IIgnoreCancelSaveResponse} from 'superdesk-api';
import {
    IPlanningContentProfile,
    IEditorProfileGroup,
    IProfileFieldEntry,
    IG2ContentType,
    IProfileSchemaTypeString,
} from '../../interfaces';
import {superdeskApi, planningApi} from '../../superdeskApi';

import {KEYBOARD_CODES} from '../../constants';
import {getLanguages} from '../../selectors/vocabs';
import {getErrorMessage} from '../../utils';
import {Button, ButtonGroup, Tabs, TabLabel, TabContent, TabPanel} from 'superdesk-ui-framework/react';
import {Modal} from '../index';
import {GroupTab, GroupTabComponent} from './GroupTab';
import {FieldTab} from './FieldTab';
import {validateAndNotifyForRequiredFields} from './utils';

import './style.scss';

interface IProfileModalProps {
    label?: string;
    profile: IPlanningContentProfile;
    systemRequiredFields: Array<string>;
    disableMinMaxFields?: Array<string>;
    disableRequiredFields?: Array<string>;
}

interface IProps {
    title: string;
    mainProfile: IProfileModalProps;
    languages: Array<IG2ContentType>;
    closeModal(): void
}

enum TAB_INDEX {
    GROUPS = 0,
    FIELDS = 1,
}

interface IState {
    activeTabId: TAB_INDEX;
    profile: IPlanningContentProfile;
    saving: boolean;
    dirty: boolean;
}

const mapStateToProps = (state) => ({
    languages: getLanguages(state),
});

class ContentProfileModalComponent extends React.Component<IProps, IState> {
    groupTab: React.RefObject<GroupTabComponent>;
    fieldTab: React.RefObject<FieldTab>;

    constructor(props) {
        super(props);

        this.state = {
            activeTabId: TAB_INDEX.GROUPS,
            profile: this.reloadOriginal(this.props.mainProfile.profile),
            saving: false,
            dirty: false,
        };
        this.groupTab = React.createRef();
        this.fieldTab = React.createRef();

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.reset = this.reset.bind(this);
        this.save = this.save.bind(this);
        this.changeTab = this.changeTab.bind(this);
        this.updateGroup = this.updateGroup.bind(this);
        this.updateGroups = this.updateGroups.bind(this);
        this.deleteGroup = this.deleteGroup.bind(this);

        this.updateField = this.updateField.bind(this);
        this.updateFields = this.updateFields.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown(event: KeyboardEvent) {
        const {querySelectorParent} = superdeskApi.utilities;

        // Close the modal if the `Escape` key was pressed, and the event came
        // from either document.body or this modal
        // Otherwise pressing `Escape` in a popup may close this modal
        // such as the IconPicker
        if (
            event.code === KEYBOARD_CODES.ESCAPE &&
            !this.state.saving &&
            event.target instanceof HTMLElement &&
            (
                event.target === document.body ||
                querySelectorParent(
                    event.target,
                    '.planning-profile-form',
                    {self: true}
                )
            )
        ) {
            event.preventDefault();
            this.closeModal();
        }
    }

    closeModal() {
        if (this.state.dirty) {
            const {gettext} = superdeskApi.localization;
            const {showIgnoreCancelSaveDialog} = superdeskApi.ui;

            showIgnoreCancelSaveDialog({
                title: gettext('Save changes?'),
                body: gettext('There are unsaved changes.'),
            }).then((response) => {
                if (response === 'save') {
                    this.save();
                } else if (response === 'ignore') {
                    this.props.closeModal();
                }
            });
        } else {
            this.props.closeModal();
        }
    }

    reloadOriginal(originalProfile?: IPlanningContentProfile): IPlanningContentProfile {
        const profile = cloneDeep(originalProfile);

        Object.keys(profile.groups ?? {}).forEach((groupId) => {
            const group = profile.groups[groupId];

            if (group == null) {
                delete profile.groups[groupId];
            } else {
                this.props.languages.forEach((language) => {
                    if (group.translations.name[language.qcode] == null) {
                        group.translations.name[language.qcode] = group.name;
                    }
                });
            }
        });

        return profile;
    }

    reset() {
        this.closeCurrentEditor(true).then((response) => {
            if (response !== 'cancel') {
                this.setState({
                    profile: this.reloadOriginal(this.props.mainProfile.profile),
                    dirty: false,
                });
            }
        });
    }

    save() {
        this.setState({saving: true});
        this.closeCurrentEditor().then((response) => {
            if (response === 'cancel') {
                this.setState({saving: false});
                return;
            }

            if (!validateAndNotifyForRequiredFields(
                this.state.profile,
                this.props.mainProfile.systemRequiredFields,
                true
            )) {
                this.setState({saving: false});
                return;
            }

            const promises = [
                planningApi.contentProfiles.patch(this.props.mainProfile.profile, this.state.profile)
            ];

            Promise.all(promises)
                .then(() => {
                    this.setState({saving: false});
                    this.props.closeModal();
                })
                .catch((error) => {
                    const {gettext} = superdeskApi.localization;
                    const {notify} = superdeskApi.ui;

                    notify.error(
                        getErrorMessage(
                            error,
                            gettext('Failed to save the profile!')
                        )
                    );

                    this.setState({saving: false});
                });
        });
    }

    closeCurrentEditor(disableSave?: boolean): Promise<IIgnoreCancelSaveResponse> {
        const currentTab = this.groupTab.current || this.fieldTab.current;

        return currentTab == null ?
            Promise.resolve('ignore') :
            currentTab.closeEditor(disableSave);
    }

    changeTab(tabId: IState['activeTabId']) {
        const currentTabId = this.state.activeTabId;

        if (tabId === currentTabId) {
            return;
        }

        this.closeCurrentEditor().then((response) => {
            if (response === 'cancel') {
                const button = document.querySelector(`.planning-profile-form #tab-${currentTabId}`);

                if (button instanceof HTMLButtonElement) {
                    button.click();
                }
            } else {
                this.setState({activeTabId: tabId});
            }
        });
    }

    updateGroup(updatedGroup: IEditorProfileGroup) {
        this.setState((prevState: Readonly<IState>) => ({
            profile: {
                ...prevState.profile,
                groups: {
                    ...prevState.profile.groups,
                    [updatedGroup._id]: updatedGroup,
                },
            },
            dirty: true,
        }));
    }

    updateGroups(groups: IPlanningContentProfile['groups']) {
        this.setState((prevState: Readonly<IState>) => ({
            profile: {
                ...prevState.profile,
                groups: groups,
            },
            dirty: true,
        }));
    }

    deleteGroup(group: IEditorProfileGroup) {
        this.setState((prevState: Readonly<IState>) => {
            const profile = {...prevState.profile};

            delete profile.groups[group._id];

            Object.keys(profile.editor)
                .forEach((field) => {
                    if (profile.editor[field].group === group._id) {
                        profile.editor[field].enabled = false;
                        profile.editor[field].group = undefined;
                        profile.editor[field].index = undefined;
                    }
                });

            return {
                profile: profile,
                dirty: true,
            };
        });
    }

    updateField(item: IProfileFieldEntry) {
        this.setState((prevState: Readonly<IState>) => {
            const profile = cloneDeep(prevState.profile);

            if (item.schema.type === 'string' && item.name === 'language') {
                const enabledBefore = (prevState.profile.schema.language as IProfileSchemaTypeString).multilingual;
                const enabledAfter = item.schema.multilingual;

                if (enabledBefore !== enabledAfter && enabledAfter === false) {
                    item.schema.languages = null;
                    item.schema.default_language = null;

                    Object.keys(profile.schema).forEach((field) => {
                        const schema = profile.schema[field];

                        if (schema?.type === 'string') {
                            schema.multilingual = false;
                        }
                    });
                }
            }

            profile.editor[item.name] = {...item.field};
            profile.schema[item.name] = {...item.schema};

            return {
                profile: profile,
                dirty: true,
            };
        });
    }

    updateFields(fields: Array<IProfileFieldEntry>) {
        this.setState((prevState: Readonly<IState>) => {
            const profile = {...prevState.profile};

            fields.forEach((item, index) => {
                profile.editor[item.name] = {...item.field};
                profile.editor[item.name].index = index;
                profile.schema[item.name] = {...item.schema};
            });

            return {
                profile: profile,
                dirty: true,
            };
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const tabLabels = [(
            <TabLabel
                key="groups"
                label={gettext('Groups')}
                indexValue={TAB_INDEX.GROUPS}
            />
        ), (
            <TabLabel
                key="content_fields"
                label={this.props.mainProfile.label ?? gettext('Content Fields')}
                indexValue={TAB_INDEX.FIELDS}
            />
        )];
        const tabPanels = [(
            <TabPanel
                key="groups"
                indexValue={TAB_INDEX.GROUPS}
            >
                <GroupTab
                    ref={this.groupTab}
                    profile={this.state.profile}
                    updateGroup={this.updateGroup}
                    updateGroups={this.updateGroups}
                    deleteGroup={this.deleteGroup}
                />
            </TabPanel>
        ), (
            <TabPanel
                key="content_fields"
                indexValue={TAB_INDEX.FIELDS}
            >
                <FieldTab
                    ref={this.fieldTab}
                    profile={this.state.profile}
                    groupFields={true}
                    systemRequiredFields={this.props.mainProfile.systemRequiredFields}
                    disableMinMaxFields={this.props.mainProfile.disableMinMaxFields}
                    disableRequiredFields={this.props.mainProfile.disableRequiredFields}
                    updateField={this.updateField}
                    updateFields={this.updateFields}
                />
            </TabPanel>
        )];

        return (
            <Modal
                show={true}
                large={true}
                removeTabIndexAttribute={true}
            >
                <Modal.Header>
                    <h3 className="modal__heading">
                        {this.props.title}
                    </h3>
                    <a
                        className="icn-btn"
                        onClick={this.state.saving ?
                            undefined :
                            this.closeModal
                        }
                    >
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body className="sd-padding--0" noScroll={true}>
                    {!this.state.saving ? null : (
                        <div className="sd-loader" />
                    )}
                    <form className="planning-profile-form" onSubmit={(e) => e.preventDefault()}>
                        <Tabs onClick={this.changeTab}>
                            {tabLabels}
                        </Tabs>
                        <TabContent activePanel={this.state.activeTabId}>
                            {tabPanels}
                        </TabContent>
                    </form>
                </Modal.Body>
                <Modal.Footer flex={true}>
                    <ButtonGroup align="end">
                        <Button
                            text={this.state.dirty ?
                                gettext('Cancel') :
                                gettext('Close')
                            }
                            style="hollow"
                            onClick={this.closeModal}
                            disabled={this.state.saving}
                        />
                        <Button
                            text={gettext('Reset')}
                            style="hollow"
                            onClick={this.reset}
                            disabled={this.state.saving || !this.state.dirty}
                        />
                        <Button
                            text={gettext('Save')}
                            type="primary"
                            onClick={this.save}
                            disabled={this.state.saving || !this.state.dirty}
                        />
                    </ButtonGroup>
                </Modal.Footer>
            </Modal>
        );
    }
}

export const ContentProfileModal = connect(mapStateToProps)(ContentProfileModalComponent);
