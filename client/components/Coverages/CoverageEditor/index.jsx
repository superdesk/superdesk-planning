import React from 'react';
import PropTypes from 'prop-types';
import {isEqual} from 'lodash';

import {CollapseBox} from '../../UI';
import {CoverageItem} from '../CoverageItem';
import {CoverageForm} from './CoverageForm';
import {CoverageFormHeader} from './CoverageFormHeader';

export const CoverageEditor = ({
    field,
    value,
    users,
    desks,
    dateFormat,
    timeFormat,
    remove,
    contentTypes,
    genres,
    newsCoverageStatus,
    onChange,
    coverageProviders,
    priorities,
    keywords,
}) => {
    const coverageItem = (
        <CoverageItem
            coverage={value}
            users={users}
            desks={desks}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
        />
    );

    const coverageTopBar = (
        <CoverageFormHeader
            field={field}
            value={value}
            onChange={onChange}
            users={users}
            desks={desks}
            coverageProviders={coverageProviders}
            priorities={priorities}
        />
    );

    const coverageForm = (
        <CoverageForm
            field={field}
            value={value}
            onChange={onChange}
            newsCoverageStatus={newsCoverageStatus}
            dateFormat={dateFormat}
            timeFormat={timeFormat}
            contentTypes={contentTypes}
            genres={genres}
            keywords={keywords}
        />
    );

    return (
        <CollapseBox
            collapsedItem={coverageItem}
            openItemTopBar={coverageTopBar}
            openItem={coverageForm}
            scrollInView={true}
            isOpen={isEqual(value, {planning: {}})}
        />
    );
};

CoverageEditor.propTypes = {
    field: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    users: PropTypes.array,
    desks: PropTypes.array,
    newsCoverageStatus: PropTypes.array,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    remove: PropTypes.func,
    contentTypes: PropTypes.array,
    genres: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    keywords: PropTypes.array,
};

CoverageEditor.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
};
