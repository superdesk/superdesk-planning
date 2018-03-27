import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {AUTOSAVE} from '../../constants';
import {forEach, isEqual, get, throttle, cloneDeep, omit} from 'lodash';

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

    getItemId(props) {
        return get(props, 'initialValues._id',
            get(props, 'initialValues._tempId'));
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
            nextProps.interval,
            {leading: false, trailing: true}
        );

        this.load(nextProps);
    }

    load(props) {
        const id = this.getItemId(props);

        if (!id) {
            return;
        }

        let changes = this.props.load(props.formName, id);
        // Strip off _tempId value as _id stored for new items

        if (get(props, 'initialValues._tempId') && get(changes, '_id')) {
            delete changes._id;
        }

        this.changeValues(changes, props);
    }

    save(currentValues, props) {
        const diff = this.changeValues(currentValues, props, false);

        if (diff !== null) {
            this.props.save(
                this.props.formName,
                diff
            );
        }
    }

    changeValues(changes, props, updateFormValues = true) {
        const {initialValues, currentValues} = props;
        const diff = {_id: this.getItemId(props)};

        // Don't change any values when moving from existing item to new one
        // Existing item will be in currentValues as Editor uses timeOut to propagate new item's changes
        if (get(currentValues, '_id') && get(initialValues, '_tempId')) {
            return;
        }

        // Merge all changes of the item and dispatch once
        let mergedChanges = cloneDeep(omit(initialValues, '_tempId'));

        forEach(changes, (value, key) => {
            if (!key.startsWith('_') && !key.startsWith('lock_') && !isEqual(value, get(initialValues, key))) {
                diff[key] = value;

                // If the value is different then last time we processed
                // Then update the form value with the new value
                if (updateFormValues && !isEqual(this.state.diff[key], get(currentValues, key, null))) {
                    mergedChanges[key] = value;
                }
            }
        });

        if (!isEqual(mergedChanges, omit(initialValues, '_tempId'))) {
            this.props.change(mergedChanges);
        }

        if (!isEqual(this.state.diff, diff)) {
            this.setState({diff});
            return diff;
        }

        return null;
    }

    componentWillReceiveProps(nextProps) {
        const currentValues = get(this.props, 'currentValues', {});
        const nextValues = get(nextProps, 'currentValues', {});

        if (currentValues._id !== nextValues._id ||
            currentValues._tempId !== nextValues._tempId) {
            // If the form item has changed, then reset this autosave
            this.reset(nextProps);
        } else if (!isEqual(currentValues, nextValues)) {
            // If the item's values have changed,
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

AutosaveComponent.propTypes = {
    formName: PropTypes.string.isRequired,
    initialValues: PropTypes.object,
    currentValues: PropTypes.object,

    // The ms interval for throttling the save dispatch
    interval: PropTypes.number,

    // Redux store actions
    save: PropTypes.func,
    load: PropTypes.func,

    change: PropTypes.func.isRequired,
};

AutosaveComponent.defaultProps = {interval: AUTOSAVE.INTERVAL};

const mapDispatchToProps = (dispatch, ownProps) => ({
    save: (formName, diff) => dispatch(actions.autosave.save(formName, diff)),
    load: (formName, itemId) => dispatch(actions.autosave.load(formName, itemId)),
});

export const Autosave = connect(
    null,
    mapDispatchToProps,
    null
)(AutosaveComponent);
