import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {change as _change} from 'redux-form';
import * as actions from '../../actions';
import {AUTOSAVE} from '../../constants';
import {forEach, isEqual, get, throttle} from 'lodash';

export class AutosaveComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {diff: {}};

        this.load = this.load.bind(this);
        this.save = this.save.bind(this);
        this.reset = this.reset.bind(this);
        this.throttledSave = null;
    }

    componentDidMount() {
        this.reset(this.props);
    }

    reset(nextProps) {
        // Reset the diff state (will be re-calculated on load)
        this.setState({diff: {}});

        // Make sure we execute the last save request
        if (get(this, 'throttledSave.flush')) {
            this.throttledSave.flush();
        }

        // Then reset the save throttle
        this.throttledSave = throttle(
            this.save,
            nextProps.interval
        );

        this.load(nextProps);
    }

    load(props) {
        if (!get(props, 'initialValues._id')) {
            return;
        }

        const changes = this.props.load(props.initialValues._id);

        this.changeValues(changes, props);
    }

    save(currentValues, props) {
        this.props.save(
            this.changeValues(currentValues, props, false)
        );
    }

    changeValues(changes, props, updateFormValues = true) {
        const {initialValues, currentValues} = props;
        const diff = {_id: initialValues._id};

        forEach(changes, (value, key) => {
            if (!key.startsWith('_') && !key.startsWith('lock_') && !isEqual(value, get(initialValues, key))) {
                diff[key] = value;

                // If the value is different then last time we processed
                // Then update the form value with the new value
                if (updateFormValues && !isEqual(this.state.diff[key], get(currentValues, key, null))) {
                    this.props.change(key, value);
                }
            }
        });

        this.setState({diff});
        return diff;
    }

    componentWillReceiveProps(nextProps) {
        const currentValues = get(this.props, 'currentValues', {});
        const nextValues = get(nextProps, 'currentValues', {});

        if (currentValues._id !== nextValues._id) {
            // If the form item has changed, then reset this autosave
            this.reset(nextProps);
        } else if (currentValues._id && !isEqual(currentValues, nextValues)) {
            // If the item has an ID and it's values have changed,
            // Then save the new values in the store
            this.throttledSave(nextValues, nextProps);
        }
    }

    componentWillUnmount() {
        if (get(this, 'throttledSave.flush')) {
            this.throttledSave.flush();
        }
    }

    render() {
        return null;
    }
}

/* eslint-disable react/no-unused-prop-types */
AutosaveComponent.propTypes = {
    formName: PropTypes.string.isRequired,
    initialValues: PropTypes.object,
    currentValues: PropTypes.object,

    // The ms interval for throttling the save dispatch
    interval: PropTypes.number,

    // Redux store actions
    save: PropTypes.func,
    load: PropTypes.func,

    // Redux-Form actions
    change: PropTypes.func.isRequired,
};
/* eslint-enable react/no-unused-prop-types */

AutosaveComponent.defaultProps = {interval: AUTOSAVE.INTERVAL};

const mapStateToProps = (state, ownProps) => ({
    initialValues: get(state, `form.${ownProps.formName}.initial`),
    currentValues: get(state, `form.${ownProps.formName}.values`),
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    save: (diff) => dispatch(actions.autosave.save(ownProps.formName, diff)),
    load: (itemId) => dispatch(actions.autosave.load(ownProps.formName, itemId)),
    change: (key, value) => dispatch(_change(ownProps.formName, key, value)),
});

export const Autosave = connect(
    mapStateToProps,
    mapDispatchToProps,
    null
)(AutosaveComponent);
