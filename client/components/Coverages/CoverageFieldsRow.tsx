import React from 'react';
import {Spacer, Select, IconButton, Option} from 'superdesk-ui-framework/react';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {gettext} from '../../utils';
import {superdeskApi} from '../../superdeskApi';
import {IPlanningNewsCoverageStatus} from '../../interfaces';
import {IDesk, IUser} from 'superdesk-api';
import {ICoverageLineItem} from './CoverageAddAdvancedModal';

interface IProps {
    index: number;
    coverage: Partial<ICoverageLineItem>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    languages: Array<any>;
    eventLanguages?: Array<string>;
    handleDeskChange: (coverage: Partial<ICoverageLineItem>, desk: IDesk) => void;
    handleUserChange: (coverage: Partial<ICoverageLineItem>, user: IUser) => void;
    updateCoverage: (coverage: Partial<ICoverageLineItem>, updates: Partial<ICoverageLineItem>) => void;
    duplicateCoverage: (index: number, coverage: Partial<ICoverageLineItem>) => void;
}

export const CoverageEditableFields = ({
    index,
    coverage,
    newsCoverageStatus,
    languages,
    handleDeskChange,
    handleUserChange,
    updateCoverage,
    duplicateCoverage,
}: IProps) => {
    const language = getUserInterfaceLanguageFromCV();
    const {SelectUser} = superdeskApi.components;

    return (
        <>
            <Spacer
                h
                gap="8"
                noWrap
                alignItems="end"
                style={{padding: 'var(--gap-1)'}}
                justifyContent="space-between"
            >
                <Select
                    fullWidth
                    label={gettext('Desk')}
                    value={coverage.desk?._id}
                    onChange={(newDeskId) => {
                        handleDeskChange(
                            coverage,
                            coverage.filteredDesks.find(({_id}) => _id === newDeskId),
                        );
                    }}
                >
                    <Option>{gettext('Select a desk')}</Option>
                    {coverage.filteredDesks.map((desk) => (
                        <Option key={desk._id} value={desk._id}>{desk.name}</Option>
                    ))}
                </Select>
                <div style={{width: '100%'}}>
                    <SelectUser
                        key={`${coverage.desk?._id}-${index}`}
                        deskId={coverage.desk?._id ?? undefined}
                        selectedUserId = {coverage.user?._id}
                        onSelect={(user) => {
                            handleUserChange(coverage, user);
                        }}
                        autoFocus={false}
                        horizontalSpacing={true}
                        clearable={true}
                    />
                </div>
                <Select
                    fullWidth
                    value={coverage.planning?.language}
                    label={gettext('Language')}
                    onChange={(value) => {
                        updateCoverage(
                            coverage,
                            {
                                planning: {
                                    ...(coverage.planning ?? {}),
                                    language: value,
                                }
                            } as ICoverageLineItem,
                        );
                    }}
                >
                    {languages.map((cov) => (
                        <Option key={cov.qcode} value={cov.qcode}>
                            {getVocabularyItemFieldTranslated(cov, 'name', language)}
                        </Option>
                    ))}
                </Select>
                <Select
                    fullWidth
                    label={gettext('Status')}
                    value={coverage.status?.qcode}
                    onChange={(value) => {
                        const status = newsCoverageStatus.find((s) => s.qcode === value);

                        updateCoverage(coverage, {status: status});
                    }}
                >
                    <Option>{gettext('Select a status')}</Option>
                    {newsCoverageStatus.map((cov) => (
                        <Option key={cov.qcode} value={cov.qcode}>
                            {getVocabularyItemFieldTranslated(cov, 'label', language)}
                        </Option>
                    ))}
                </Select>
            </Spacer>
            <div className="sd-list-item__action-menu sd-list-item__action-menu--direction-row">
                <IconButton
                    ariaValue={gettext('Duplicate')}
                    icon="plus-sign"
                    onClick={() => {
                        duplicateCoverage(index, coverage);
                    }}
                />
            </div>
        </>
    );
};
