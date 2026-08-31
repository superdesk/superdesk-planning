import * as React from 'react';
import {cloneDeep, omit} from 'lodash';
import {
    IProfileFieldEntry,
    IPlanningContentProfile,
    ICoverageType,
    IEditorProfile,
} from '../../interfaces';
import {superdeskApi, planningApi} from '../../superdeskApi';
import {getErrorMessage, planningUtils} from '../../utils';
import {contentTypes, session} from '../../selectors/general';
import {Button, Modal, RadioButtonGroup, Spacer} from 'superdesk-ui-framework/react';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import {FieldTab} from './FieldTab';
import './style.scss';
import {COVERAGE_SYSTEM_REQUIRED_FIELDS} from '../../api/utils/constants';
import {validateAndNotifyForRequiredFields} from './utils';
import {updateCoverageProfiles} from '../../actions/coverages';
import {coverageProfiles, oldProfile} from '../../selectors/coverageProfiles';

interface IState {
    saving: boolean;
    dirty: boolean;
    originalProfile: Partial<IPlanningContentProfile>;
    profile: Partial<IPlanningContentProfile> & IEditorProfile;
    selectedType: ICoverageType;
    allProfiles: Array<IPlanningContentProfile>;
}

interface IProps {
    closeModal(): void;
}

export class CoverageProfilesModal extends React.Component<IProps, IState> {
    availableCoverageTypes: Array<{value: ICoverageType; label: string; icon: string}>;

    constructor(props) {
        super(props);

        const state = planningApi.redux.store.getState();
        const allProfiles = coverageProfiles(state);
        const userInterfaceLanguage = session(planningApi.redux.store.getState()).identity.language ?? 'en';

        this.availableCoverageTypes = (contentTypes(planningApi.redux.store.getState()))
            .map((item) => ({
                value: item.qcode as ICoverageType,
                label: getVocabularyItemFieldTranslated(
                    item,
                    superdeskApi.helpers.nameof<typeof item>('name'),
                    userInterfaceLanguage,
                ),

                // remove 'icon-' string because RadioButtonGroup icon prop for each option expects just icon name
                // function not changed because it's originally used in other places
                icon: planningUtils.getCoverageIcon(item['content item type'] || item.qcode).replace('icon-', ''),
            }));

        const selectedType = this.availableCoverageTypes?.[0]?.value ?? 'text';
        const newlyCreatedProfile = allProfiles.find((x) => x.content_type === selectedType);
        const defaultProfile = newlyCreatedProfile ? newlyCreatedProfile : omit(oldProfile(state), '_id');

        this.state = {
            saving: false,
            dirty: false,
            profile: defaultProfile,
            originalProfile: defaultProfile,
            selectedType: selectedType,
            allProfiles: allProfiles,
        };

        this.closeModal = this.closeModal.bind(this);
        this.save = this.save.bind(this);
        this.updateField = this.updateField.bind(this);
        this.updateFields = this.updateFields.bind(this);
    }

    closeModal() {
        if (this.state.dirty) {
            const {gettext} = superdeskApi.localization;
            const {showIgnoreCancelSaveDialog} = superdeskApi.ui;

            showIgnoreCancelSaveDialog({
                title: gettext('Unsaved changes'),
                body: gettext('Your changes will be lost if you close now. What would you like to do?'),
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

    save() {
        this.setState({saving: true});

        if (!validateAndNotifyForRequiredFields(
            this.state.profile,
            COVERAGE_SYSTEM_REQUIRED_FIELDS,
            false
        )) {
            this.setState({saving: false});
            return;
        }

        planningApi.contentProfiles.patch(
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
        const profileUpdated = {
            ...this.state.profile,
            editor: {
                ...this.state.profile.editor,
                [item.name]: item.field,
            },
            schema: {
                ...this.state.profile.schema,
                [item.name]: item.schema,
            },
        };

        this.setState({
            profile: profileUpdated,
            dirty: true,
        });
    }

    updateFields(fields: Array<IProfileFieldEntry>) {
        const profileCloned = cloneDeep(this.state.profile);

        fields.forEach((item, index) => {
            profileCloned.editor[item.name] = {...item.field};
            profileCloned.schema[item.name] = {...item.schema};
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

        return (
            <Modal
                visible
                size="large"
                position="top"
                contentPadding="none"
                closeOnEscape
                onHide={this.closeModal}
                headerTemplate={gettext('Manage Coverage Profiles')}
                footerTemplate={(
                    <Spacer gap="4" alignItems="end" justifyContent="end" h noGrow>
                        <Button
                            onClick={this.closeModal}
                            text={this.state.dirty ?
                                gettext('Discard All') :
                                gettext('Close')
                            }
                            type="tertiary"
                        />
                        {this.state.dirty && (
                            <Button
                                isLoading={this.state.saving}
                                text={gettext('Save All')}
                                type="primary"
                                onClick={this.save}
                                disabled={this.state.saving}
                            />
                        )}
                    </Spacer>
                )}
                className="planning-profile-form"
            >
                <Spacer gap="0" h justifyContent="center" alignItems="start" noWrap>
                    <div style={{padding: '1rem', width: 200}}>
                        <RadioButtonGroup
                            onChange={(nextType: ICoverageType) => {
                                this.switchProfileType(nextType);
                            }}
                            options={this.availableCoverageTypes}
                            group={{
                                orientation: 'vertical',
                            }}
                            value={this.state.selectedType}
                        />
                    </div>
                    <FieldTab
                        isProfileCoverage={true}
                        profile={this.state.profile}
                        groupFields={false}
                        systemRequiredFields={COVERAGE_SYSTEM_REQUIRED_FIELDS}
                        disableMinMaxFields={[
                            'g2_content_type',
                            'language',
                            'genre',
                            'news_coverage_status',
                            'no_content_linking',
                            'anpa_category',
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
