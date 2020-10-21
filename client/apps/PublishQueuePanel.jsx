import React from 'react';
import {Provider} from 'react-redux';
import PropTypes from 'prop-types';
import {PublishQueuePreview} from '../components/PublishQueuePreview';

export const PublishQueuePanel = ({store}) => (
    <Provider store={store}>
        <PublishQueuePreview />
    </Provider>
);


PublishQueuePanel.propTypes = {store: PropTypes.object};


