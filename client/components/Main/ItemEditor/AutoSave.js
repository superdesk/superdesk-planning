import {AUTOSAVE} from '../../../constants';
import {throttle, isNil, get, cloneDeep} from 'lodash';
import * as actions from '../../../actions';


export class AutoSave {
    constructor(editor) {
        this.editor = editor;
        this.dispatch = this.editor.props.dispatch;

        this.throttledSave = null;
        this.autosaveItem = null;

        this.flushAutosave = this.flushAutosave.bind(this);
        this.loadAutosave = this.loadAutosave.bind(this);
        this.saveAutosave = this.saveAutosave.bind(this);
        this.createAutosave = this.createAutosave.bind(this);
        this.createOrLoadAutosave = this.createOrLoadAutosave.bind(this);
        this.remove = this.remove.bind(this);
    }

    componentWillMount() {
        // Make sure to flush the autosave on page refresh/navigate away
        window.addEventListener('beforeunload', this.flushAutosave);
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.flushAutosave);
    }

    get props() {
        return this.editor.props;
    }

    get state() {
        return this.editor.state;
    }

    setState(state, cb) {
        let promise = Promise.resolve();

        if (this.editor && this.editor.setState) {
            promise = new Promise((resolve) => {
                this.editor.setState(state, resolve);
            });
        }

        if (cb) {
            promise.then(cb);
        }

        return promise;
    }

    _initThrottle() {
        if (!this.throttledSave) {
            this.throttledSave = throttle(
                this._saveAutosave,
                AUTOSAVE.INTERVAL,
                {leading: false, trailing: true}
            );
        }
    }

    flushAutosave() {
        if (get(this, 'throttledSave.flush')) {
            return this.throttledSave.flush() || Promise.resolve();
        }

        return Promise.resolve();
    }

    cancelAutosave() {
        if (get(this, 'throttledSave.cancel')) {
            this.throttledSave.cancel();
        }

        this.throttledSave = null;
        this.autosaveItem = null;
    }

    _saveAutosave(updates) {
        // Set submitting to true so that form controls are temporarily disable
        const changeState = !this.state.submitting;
        const promise = !changeState ?
            Promise.resolve() :
            this.setState({submitting: true});

        return promise.then(() => (
            this.dispatch(actions.autosave.save(this.autosaveItem, updates))
                .then((autosaveItem) => {
                    this.autosaveItem = autosaveItem;

                    return !changeState ?
                        Promise.resolve() :
                        this.setState({submitting: false});
                })
                .then(() => Promise.resolve(this.autosaveItem))
        ));
    }

    saveAutosave(props, diff) {
        // Don't use Autosave if we're in read-only mode
        if (props.itemAction === 'read') {
            return;
        }

        this._initThrottle();
        this.throttledSave(diff);
    }

    loadAutosave(nextProps) {
        const {itemType, itemId} = nextProps;

        // Don't use Autosave if we're in read-only mode
        if (nextProps.itemAction === 'read') {
            return Promise.resolve();
        }

        return this.dispatch(
            actions.autosave.fetchById(
                itemType,
                itemId,
                false,
                true
            )
        )
            .then((autosaveItem) => {
                if (!isNil(autosaveItem)) {
                    this.autosaveItem = autosaveItem;
                }

                return autosaveItem;
            });
    }

    createAutosave(diff) {
        this.cancelAutosave();
        this._initThrottle();
        return this._saveAutosave(diff);
    }

    createOrLoadAutosave(nextProps, diff) {
        return this.loadAutosave(nextProps)
            .then((autosaveItem) => (
                isNil(autosaveItem) ?
                    this.createAutosave(diff) :
                    autosaveItem
            ));
    }

    remove() {
        // Flush the autosave to fix a possible race condition
        // Where a save is already been sent to the server directly before
        // attempting to remove the autosave item
        // So force the flushing of autosave, then cancel & remove the autosave
        return this.flushAutosave()
            .then(() => {
                const autosaveItem = cloneDeep(this.autosaveItem);

                this.cancelAutosave();
                if (autosaveItem !== null) {
                    return this.dispatch(
                        actions.autosave.remove(autosaveItem)
                    );
                }

                return Promise.resolve();
            });
    }
}
