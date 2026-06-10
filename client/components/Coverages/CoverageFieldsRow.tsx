import React from 'react';
import {Select, IconButton, Option} from 'superdesk-ui-framework/react';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {gettext} from '../../utils';
import {superdeskApi} from '../../superdeskApi';
import {IPlanningNewsCoverageStatus} from '../../interfaces';
import {IDesk, IUser, IVocabularyItem} from 'superdesk-api';
import {ICoverageLineItem} from './CoverageAddAdvancedModal';

interface IProps {
    coverage: Partial<ICoverageLineItem>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    languages: Array<{value: IVocabularyItem}>;
    handleDeskChange: (coverage: Partial<ICoverageLineItem>, desk: IDesk) => void;
    handleUserChange: (coverage: Partial<ICoverageLineItem>, user: IUser) => void;
    updateCoverage: (coverage: Partial<ICoverageLineItem>, updates: Partial<ICoverageLineItem>) => void;
    duplicateCoverage: (coverage: Partial<ICoverageLineItem>) => void;
}

export const CoverageEditableFields = ({
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
        <div className="d-flex gap-1 flex-grow items-end py-1 px-1-5">
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
            <SelectUser
                key={`${coverage.desk?._id}-${coverage.rowId}`}
                deskId={coverage.desk?._id ?? undefined}
                selectedUserId = {coverage.user?._id}
                onSelect={(user) => {
                    handleUserChange(coverage, user);
                }}
                autoFocus={false}
                horizontalSpacing={true}
                clearable={true}
                inlineLabel={false}
                labelHidden={false}
                displayStatus={false}
            />
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
                <Option value={null}>{gettext('Select a language')}</Option>
                {languages.map((lang) => (
                    <Option key={lang.value.qcode} value={lang.value.qcode}>
                        {getVocabularyItemFieldTranslated(lang.value, 'name', language)}
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
            <IconButton
                ariaValue={gettext('Duplicate')}
                icon="plus-sign"
                onClick={() => {
                    duplicateCoverage(coverage);
                }}
            />
        </div>
    );
};
