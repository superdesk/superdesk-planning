
// Types
import {Store} from 'redux';

let globalStore: Store | undefined;

export function setStore(store: Store) {
    globalStore = store;
}

export function getStore(): Store | undefined {
    return globalStore;
}
