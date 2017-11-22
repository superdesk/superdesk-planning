import React from 'react';
import PropTypes from 'prop-types';
import EditorFormRow from './EditorFormRow';

class EditorContentTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {diff: Object.assign({}, props.item)};
    }

    onChangeHandler(field) {
        return (event) => {
            const diff = Object.assign({}, this.state.diff);
            diff[field] = event.target.value;
            this.setState({diff});
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.item !== this.props.item) {
            this.setState({diff: Object.assign({}, nextProps.item)});
        }
    }

    render() {
        return (
            <div>
                <EditorFormRow
                    label={gettext('Slugline')}
                    value={this.state.diff.slugline || ''}
                    onChange={this.onChangeHandler('slugline')}
                />
                <EditorFormRow
                    label={gettext('Name')}
                    value={this.state.diff.name || ''}
                    onChange={this.onChangeHandler('name')}
                />
            </div>
        );
    }
}

EditorContentTab.propTypes = {
    item: PropTypes.object,
};

export default EditorContentTab;
