/**
 * Action Dispatcher that retries the action multiple times
 * until the supplied `check` function returns true, or maxRetries is exceeded
 * or the supplied `action` dispatcher returns a rejected Promise.
 * @param {action} action - The Action to dispatch
 * @param {function} check - The function used to indicate that action dispatched succeeded
 * @param {int} maxRetries - The maximum retries before failing, defaults to 5
 * @param {int} interval - The ms between each and before the first dispatch, defaults to 1000
 * @param {int} retries - Automatically calculated number of retry attempts
 */
const retryDispatch = (action, check, maxRetries = 5, interval = 1000, retries = 0) => (
    (dispatch) => {
        dispatch({
            type: 'RETRY_DISPATCH',
            payload: {
                maxRetries,
                retries,
                interval,
            },
        });
        if (retries >= maxRetries) {
            return Promise.reject({error_msg: 'Max retries exceeded'});
        }

        return new Promise((resolve) => setTimeout(resolve, interval))
            .then(() => dispatch(action)
                .then(
                    (data) => {
                        if (check(data) === true) {
                            return Promise.resolve(data);
                        }

                        return dispatch(
                            retryDispatch(action, check, maxRetries, interval, retries + 1)
                        );
                    },

                    (error) => Promise.reject(error)
                )
            );
    }
);

/**
 * Action Dispatcher to schedule after interval.
 * @param {action} action - The Action to dispatch
 * @param {object} next - called property indicates that action is executing
 * @param {int} interval - The ms between before the first dispatch, defaults to 1000
 */
const scheduleDispatch = (action, next, interval = 1000) => (
    (dispatch) => {
        if (next.called) {
            return Promise.resolve([]);
        }

        return new Promise((resolve) => {
            next.called = setTimeout(resolve, interval);
        })
            .then(() => dispatch(action)
                .then(
                    (data) => {
                        next.called = 0;
                        return Promise.resolve(data);
                    },
                    (error) => {
                        next.called = 0;
                        return Promise.reject(error);
                    }
                )
            );
    }
);

// eslint-disable-next-line consistent-this
const self = {
    retryDispatch,
    scheduleDispatch
};

export default self;
