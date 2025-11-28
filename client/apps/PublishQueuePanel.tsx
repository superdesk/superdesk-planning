import React, {useState, useEffect} from 'react';
import {Provider} from 'react-redux';
import {Store} from 'redux';
import {Loader} from 'superdesk-ui-framework/react';
import {PublishQueuePreview} from '../components';

interface IProps {
    storePromise: Promise<Store>;
}

export const PublishQueuePanel: React.FC<IProps> = ({storePromise}) => {
    const [store, setStore] = useState<Store | null>(null);

    useEffect(() => {
        storePromise.then((loadedStore) => {
            setStore(loadedStore);
        });
    }, []); // Empty dependency array ensures it runs only once on mount

    return store == null ? (
        <div className="sd-preview-panel  preview-pane content-item-preview">
            <Loader />
        </div>
    ) : (
        <Provider store={store}>
            <PublishQueuePreview />
        </Provider>
    );
};
