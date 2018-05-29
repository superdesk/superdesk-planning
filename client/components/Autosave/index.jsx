import React from 'react';
import PropTypes from 'prop-types';
import {forEach, isEqual, get, throttle, cloneDeep, isEmpty} from 'lodash';
import moment from 'moment';

import {AUTOSAVE} from '../../constants';
import {getItemId, isExistingItem} from '../../utils';

export class Autosave extends React.Component {
    constructor(props) {
        super(props);

        this.state = {diff: {}};

        this.load = this.load.bind(this);
        this._save = this._save.bind(this);
        this.save = this.save.bind(this);
        this.reset = this.reset.bind(this);
        this.onSubmittingChange = this.onSubmittingChange.bind(this);
        this.throttledSave = null;
    }

    componentDidMount() {
        this.init(this.props);
    }

    reset(nextProps) {
        // Reset the diff state (will be re-calculated on load)
        this.setState({diff: {}});

        // Make sure we execute the last save request
        this.flush();

        this.init(nextProps);
    }

    init(nextProps) {
        // Then reset the save throttle
        this.throttledSave = throttle(
            this._save,
            nextProps.interval,
            {leading: false, trailing: true}
        );

        this.load(nextProps)
            .then((changes) => {
                if (isEmpty(changes)) {
                    // If this is a new Autosave entry
                    // then save the item now
                    this._save(get(nextProps, 'currentValues', {}), nextProps);
                }
            });
    }

    /**
     * Load the autosave data from the Redux store (which should already be loaded from the server)
     * Then pass the changes onto the Editor so the form fields can be updated with the autosave data
     * @param {object} props - The props containing the initialValues
     */
    load(props) {
        const id = getItemId(props.initialValues);

        if (!id) {
            return;
        }

        return this.props.load(props.formName, id)
            .then((changes) => {
                this.changeValues(changes || {}, props);

                return Promise.resolve(changes);
            });
    }

    _save(currentValues, props) {
        this.props.save({
            ...currentValues,
            _id: getItemId(props.initialValues),
        });
    }

    save(nextValues, nextProps) {
        if (!this.throttledSave) {
            this.throttledSave = throttle(
                this._save,
                nextProps.interval,
                {leading: false, trailing: true}
            );
        }

        this.throttledSave(nextValues, nextProps);
    }

    changeValues(changes, props, updateFormValues = true) {
        const {initialValues, currentValues} = props;
        const diff = {_id: getItemId(props.initialValues)};

        // Don't change any values when moving from existing item to new one
        // Existing item will be in currentValues as Editor uses timeOut to propagate new item's changes
        if (isExistingItem(currentValues) && !isExistingItem(initialValues)) {
            return;
        }

        // Merge all changes of the item and dispatch once
        let mergedChanges = cloneDeep(initialValues);

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

        if (get(mergedChanges, 'dates.start')) {
            mergedChanges.dates.start = moment(mergedChanges.dates.start);
        }

        if (get(mergedChanges, 'dates.end')) {
            mergedChanges.dates.end = moment(mergedChanges.dates.end);
        }

        if (!isEqual(mergedChanges, initialValues)) {
            this.props.change(mergedChanges);
        }

        if (!isEqual(this.state.diff, diff)) {
            this.setState({diff});
            return diff;
        }

        return null;
    }

    onSubmittingChange(submitting) {
        if (submitting) {
            this.throttledSave.cancel();
            this.throttledSave = null;
        }
    }

    componentWillReceiveProps(nextProps) {
        const currentValues = get(this.props, 'currentValues', {});
        const nextValues = get(nextProps, 'currentValues', {});

        if (nextProps.submitting !== this.props.submitting) {
            this.onSubmittingChange(nextProps.submitting);
        } else if (getItemId(currentValues) !== getItemId(nextValues)) {
            // If the form item has changed, then reset this autosave
            this.reset(nextProps);
        } else if (!isEqual(currentValues, nextValues)) {
            // If the item's values have changed,
            // Then save the new values in the store
            this.save(nextValues, nextProps);
        }
    }

    componentWillUnmount() {
        this.flush();
    }

    flush() {
        if (get(this, 'throttledSave.flush')) {
            this.throttledSave.flush();
        }
    }

    render() {
        return null;
    }
}

Autosave.propTypes = {
    formName: PropTypes.string.isRequired,
    initialValues: PropTypes.object,
    currentValues: PropTypes.object,
    inModalView: PropTypes.bool,
    submitting: PropTypes.bool,

    // The ms interval for throttling the save dispatch
    interval: PropTypes.number,

    // Redux store actions
    save: PropTypes.func,
    load: PropTypes.func,

    change: PropTypes.func.isRequired,
};

Autosave.defaultProps = {interval: AUTOSAVE.INTERVAL};
