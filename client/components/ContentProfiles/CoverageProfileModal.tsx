import * as React from 'react';
import {cloneDeep, omit} from 'lodash';
import {
    IProfileFieldEntry,
    IG2ContentType,
    ICoverageContentProfile,
    ICoverageType,
    IEditorProfile,
} from '../../interfaces';
import {superdeskApi, planningApi} from '../../superdeskApi';
import {getErrorMessage} from '../../utils';
import {Button, Modal, Spacer} from 'superdesk-ui-framework/react';
import {FieldTab} from './FieldTab';
import './style.scss';
import {getLanguages} from '../../selectors/vocabs';
import {validateRequiredFields} from './utils';
import {COVERAGE_SYSTEM_REQUIRED_FIELDS} from '../../api/utils/constants';
import {updateCoverageProfiles} from '../../actions/coverages';
import {coverageProfiles, oldProfile} from '../../selectors/coverageProfiles';

interface IState {
    saving: boolean;
    dirty: boolean;
    languages: Array<IG2ContentType>;
    originalProfile: Partial<ICoverageContentProfile>;
    profile: Partial<ICoverageContentProfile> & IEditorProfile;
    selectedType: ICoverageType;
    allProfiles: Array<ICoverageContentProfile>;
}

interface IProps {
    closeModal(): void;
}

const coverageType: Array<ICoverageType> = [
    'text', 'picture', 'video', 'audio', 'infographics', 'liveBlog', 'liveVideo'
];

export class CoverageProfilesModal extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        const state = planningApi.redux.store.getState();
        const allProfiles = coverageProfiles(state);
        const newlyCreatedProfile = allProfiles.find((x) => x.content_type === 'text');
        const defaultProfile = newlyCreatedProfile ? newlyCreatedProfile : omit(oldProfile(state), '_id');

        this.state = {
            saving: false,
            dirty: false,
            profile: defaultProfile,
            originalProfile: defaultProfile,
            languages: getLanguages(state),
            selectedType: 'text',
            allProfiles: allProfiles,
        };

        this.closeModal = this.closeModal.bind(this);
        this.reset = this.reset.bind(this);
        this.save = this.save.bind(this);
        this.updateField = this.updateField.bind(this);
        this.updateFields = this.updateFields.bind(this);
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

    reset() {
        this.setState({
            profile: cloneDeep(this.state.originalProfile),
            dirty: false,
        });
    }

    save() {
        this.setState({saving: true});

        if (!validateRequiredFields(
            this.state.profile,
            COVERAGE_SYSTEM_REQUIRED_FIELDS,
            false
        )) {
            this.setState({saving: false});
            return;
        }

        planningApi.contentProfiles.coverages.patch(
            this.state.originalProfile,
            {
                ...this.state.profile,
                content_type: this.state.selectedType,
            },
        )
            .then((updatedProfile) => {
                const profilesWithoutUpdated = cloneDeep(this.state.allProfiles)
                    .filter((x) => x._id !== updatedProfile._id);

                planningApi.redux.store.dispatch(updateCoverageProfiles([
                    ...profilesWithoutUpdated,
                    updatedProfile,
                ]));

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
    }

    updateField(item: IProfileFieldEntry) {
        const profileCloned = cloneDeep(this.state.profile);

        profileCloned.editor[item.name] = {...item.field};
        profileCloned.schema[item.name] = {...item.schema};

        this.setState({
            profile: profileCloned,
            dirty: true,
        });
    }

    updateFields(fields: Array<IProfileFieldEntry>) {
        const profileCloned = cloneDeep(this.state.profile);

        fields.forEach((item, index) => {
            profileCloned.editor[item.name] = {...item.field};
            profileCloned.editor[item.name].index = index;
        });

        this.setState({
            profile: profileCloned,
            dirty: true,
        });
    }

    switchProfileType(type: ICoverageType) {
        const getByType = (type: ICoverageType) => {
            const profileForType = this.state.allProfiles.find((x) => x.content_type === type);

            if (profileForType != null) {
                return profileForType;
            }

            const state = planningApi.redux.store.getState();

            // fallback to old profile if there's not a match, remove _id so logic for patch/create follows through
            return omit(oldProfile(state), '_id');
        };

        const newProfile = getByType(type);

        this.setState({
            originalProfile: newProfile,
            profile: newProfile,
            selectedType: type,
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {selectedType} = this.state;
        const propsMap: Record<ICoverageType, {label: string; icon: string;}> = {
            text: {
                label: gettext('Text'),
                icon: 'text',
            },
            picture: {
                label: gettext('Picture'),
                icon: 'picture',
            },
            video: {
                label: gettext('Video'),
                icon: 'video'
            },
            audio: {
                label: gettext('Audio'),
                icon: 'audio'
            },
            infographics: {
                label: gettext('Infographics'),
                icon: 'file',
            },
            liveBlog: {
                label: gettext('Live Blog'),
                icon: 'video',
            },
            liveVideo: {
                label: gettext('Live Video'),
                icon: 'post',
            },
        };

        return (
            <Modal
                visible
                size="large"
                position="top"
                contentPadding="none"
                closeOnEscape
                onHide={this.closeModal}
                headerTemplate={gettext('Manage coverage profiles')}
                footerTemplate={(
                    <Spacer gap="4" alignItems="end" justifyContent="end" h noGrow>
                        <Button
                            onClick={this.closeModal}
                            text={gettext('Cancel')}
                        />
                        <Button
                            text={gettext('Reset')}
                            style="hollow"
                            onClick={this.reset}
                            disabled={this.state.saving || !this.state.dirty}
                        />
                        <Button
                            isLoading={this.state.saving}
                            text={gettext('Save')}
                            type="primary"
                            onClick={this.save}
                            disabled={this.state.saving || !this.state.dirty}
                        />
                    </Spacer>
                )}
                className="planning-profile-form"
            >
                <Spacer gap="0" h justifyContent="center" alignItems="start" noWrap style={{height: '500px'}}>
                    <Spacer gap="4" v style={{height: 'auto', width: '30%', padding: 12}} noWrap>
                        {coverageType.map((type) => (
                            <Button
                                key={type}
                                onClick={() => {
                                    this.switchProfileType(type);
                                }}
                                expand
                                icon={propsMap[type].icon}
                                text={propsMap[type].label}
                                type={selectedType === type ? 'primary' : 'default'}
                                style={selectedType === type ? 'filled' : 'hollow'}
                            />
                        ))}
                    </Spacer>
                    <FieldTab
                        profile={this.state.profile}
                        groupFields={false}
                        systemRequiredFields={COVERAGE_SYSTEM_REQUIRED_FIELDS}
                        disableMinMaxFields={[
                            'g2_content_type',
                            'language',
                            'genre',
                            'news_coverage_status',
                            'no_content_linking',
                        ]}
                        disableRequiredFields={['no_content_linking']}
                        updateField={this.updateField}
                        updateFields={this.updateFields}
                    />
                </Spacer>
            </Modal>
        );
    }
}

