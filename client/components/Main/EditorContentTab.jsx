import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Row} from '../UI/Form';

export const EditorContentTab = ({diff, onChangeHandler}) => (
    <div>
        <Row
            label={gettext('Slugline')}
            value={diff.slugline || ''}
            onChange={onChangeHandler('slugline')}
        />
        <Row
            label={gettext('Name')}
            value={diff.name || ''}
            onChange={onChangeHandler('name')}
        />
    </div>
);

EditorContentTab.propTypes = {
    diff: PropTypes.object.isRequired,
    onChangeHandler: PropTypes.func.isRequired,
};
