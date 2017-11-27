import React from 'react';
import PropTypes from 'prop-types';
import EditorFormRow from './EditorFormRow';

class EditorContentTab extends React.Component {
    render() {
        const {diff, onChangeHandler} = this.props;
        return (
            <div>
                <EditorFormRow
                    label={gettext('Slugline')}
                    value={diff.slugline || ''}
                    onChange={onChangeHandler('slugline')}
                />
                <EditorFormRow
                    label={gettext('Name')}
                    value={diff.name || ''}
                    onChange={onChangeHandler('name')}
                />
            </div>
        );
    }
}

EditorContentTab.propTypes = {
    diff: PropTypes.object.isRequired,
    onChangeHandler: PropTypes.func.isRequired,
};

export default EditorContentTab;
