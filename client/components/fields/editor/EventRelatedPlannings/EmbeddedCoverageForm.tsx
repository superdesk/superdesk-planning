import * as React from 'react';
import {connect} from 'react-redux';

import {IDesk, IUser, IVocabularyItem} from 'superdesk-api';
import {
    IPlanningNewsCoverageStatus,
    IPlanningConfig,
    IPlanningContentProfile,
    IEventItem,
    ISearchProfile
} from '../../../../interfaces';
import {ICoverageDetails} from './CoverageRowForm';
import {superdeskApi, planningApi} from '../../../../superdeskApi';
import {getDesksForUser, getUsersForDesk} from '../../../../utils';
import {Select, Option} from 'superdesk-ui-framework/react';
import * as List from '../../../UI/List';
import {Row, SelectUserInput} from '../../../UI/Form';
import {EditorFieldNewsCoverageStatus} from '../NewsCoverageStatus';
import * as config from 'appConfig';
import {getLanguagesForTreeSelectInput} from '../../../../selectors/vocabs';

const appConfig = config.appConfig as IPlanningConfig;

interface IProps {
    coverage: ICoverageDetails;
    language?: string;
    errors?: {desk?: string};
    desks: Array<IDesk>;
    users: Array<IUser>;
    languages: Array<{value: IVocabularyItem}>;
    event: IEventItem;
    profile: IPlanningContentProfile;
    coverageProfile?: ISearchProfile;

    update(updates: Partial<ICoverageDetails>): void;
}

/**
* return all languages or only ones that satisfy multilingual scheme
*/
function getLanguagesForCoverage(
    profile: IPlanningContentProfile,
    allLanguages: Array<{value: IVocabularyItem}>,
    event: IEventItem,
    coverage: ICoverageDetails,
): {
    allLanguages: Array<{value: IVocabularyItem}>;
    language: string;
} {
    const {multilingual} = planningApi.contentProfiles;

    const isMultilingual = multilingual.isEnabled(profile);

    const schemaLanguages = multilingual.getLanguages(profile);

    const languages = isMultilingual
        ? allLanguages.filter((language) => (
            schemaLanguages.includes(language.value.qcode)
        ))
        : allLanguages;

    const coverageLanguage = languages.find((qcode) => (
        coverage.language === qcode.value.qcode
    ));

    const language = (() => {
        if (isMultilingual) {
            return event.languages.find((qcode) => (
                coverageLanguage?.value?.qcode === qcode
            ));
        } else {
            return event.language === coverageLanguage?.value?.qcode
                ? coverageLanguage.value.qcode
                : undefined;
        }
    })();

    return {
        allLanguages: languages,
        language: language,
    };
}

export class EmbeddedCoverageFormComponent extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.onDeskChange = this.onDeskChange.bind(this);
        this.onStatusChange = this.onStatusChange.bind(this);
        this.onUserChange = this.onUserChange.bind(this);
        this.onLanguageChange = this.onLanguageChange.bind(this);
    }

    onDeskChange(deskId?: IDesk['_id']) {
        const newDesk = deskId == null ? null : this.props.desks.find((desk) => desk._id === deskId);

        const updates: Partial<ICoverageDetails> = {
            desk: newDesk,
            filteredUsers: getUsersForDesk(newDesk, this.props.users),
        };

        if ((this.props.coverage.language ?? '').length < 1) {
            updates.language = newDesk.desk_language;
        }

        this.props.update(updates);
    }

    onLanguageChange(language: string) {
        this.props.update({language: language});
    }

    onStatusChange(field: string, status: IPlanningNewsCoverageStatus) {
        this.props.update({status: status});
    }

    onUserChange(field: string, user?: IUser) {
        const updates: Partial<ICoverageDetails> = {
            user: user,
            filteredDesks: getDesksForUser(user, this.props.desks),
        };

        this.props.update(updates);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {coverage} = this.props;

        const {allLanguages, language} = getLanguagesForCoverage(
            this.props.profile,
            this.props.languages,
            this.props.event,
            this.props.coverage,
        );

        return (
            <List.Item shadow={1} className="sd-margin-t--0">
                <List.Column
                    grow={true}
                    border={false}
                >
                    <List.Row>
                        <Row
                            testId="desk"
                            noPadding={true}
                        >
                            <Select
                                label={gettext('Desk:')}
                                value={coverage.desk?._id}
                                onChange={this.onDeskChange}
                                required={appConfig.planning_auto_assign_to_workflow}
                                invalid={this.props.errors?.desk != null}
                                error={this.props.errors?.desk}
                            >
                                <Option />
                                {coverage.filteredDesks.map(
                                    (desk) => (
                                        <Option
                                            key={desk._id}
                                            value={desk._id}
                                        >
                                            {desk.name}
                                        </Option>
                                    )
                                )}
                            </Select>
                        </Row>
                    </List.Row>
                    <List.Row>
                        <Row
                            testId="user"
                            noPadding={true}
                        >
                            <SelectUserInput
                                field="user"
                                placeholder={gettext('Search users')}
                                value={coverage.user}
                                onChange={this.onUserChange}
                                users={coverage.filteredUsers}
                            />
                        </Row>
                    </List.Row>
                    <List.Row>
                        <Row>
                            {this.props.coverageProfile.language != null && (
                                <Select
                                    label={gettext('Language:')}
                                    value={language}
                                    onChange={(item) => this.onLanguageChange(item)}
                                >
                                    <Option />
                                    {allLanguages.map(
                                        (language) => (
                                            <Option
                                                key={language.value.qcode}
                                                value={language.value.qcode}
                                            >
                                                {language.value.name}
                                            </Option>
                                        )
                                    )}
                                </Select>
                            )}
                        </Row>
                    </List.Row>
                    <List.Row>
                        <EditorFieldNewsCoverageStatus
                            testId="status"
                            item={coverage}
                            field="status"
                            label={gettext('Status:')}
                            onChange={this.onStatusChange}
                            language={this.props.language}
                        />
                    </List.Row>
                </List.Column>
            </List.Item>
        );
    }
}

const mapStateToProps = (state) => ({
    languages: getLanguagesForTreeSelectInput(state),
});

export const EmbeddedCoverageForm = connect(mapStateToProps)(EmbeddedCoverageFormComponent);
