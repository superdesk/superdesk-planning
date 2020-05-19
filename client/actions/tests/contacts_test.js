import sinon from 'sinon';

import contactsApi from '../contacts';
import {getTestActionStore, restoreSinonStub} from '../../utils/testUtils';

describe('actions.contacts', () => {
    let store;
    let services;
    let data;

    beforeEach(() => {
        store = getTestActionStore();
        services = store.services;
        data = store.data;
    });

    describe('getContacts', () => {
        beforeEach(() => {
            services.api('contacts').query = sinon.spy(
                () => Promise.resolve({_items: data.contacts.contacts})
            );
            sinon.stub(contactsApi, 'receiveContacts').callsFake(() => (Promise.resolve({})));
        });

        afterEach(() => {
            restoreSinonStub(services.api('contacts').query);
            restoreSinonStub(contactsApi.receiveContacts);
        });

        it('perform a text search', (done) => {
            store.test(done, contactsApi.getContacts('bob'))
                .then(() => {
                    expect(services.api('contacts').query.callCount).toBe(1);
                    expect(services.api('contacts').query.args[0]).toEqual([{
                        source: {
                            query: {
                                bool: {
                                    must: [{
                                        query_string: {
                                            fields: [],
                                            query: 'bob*',
                                            default_operator: 'AND',
                                        },
                                    }],
                                    should: [
                                        {term: {is_active: true}},
                                        {term: {public: true}},
                                    ],
                                },
                            },
                        },
                        sort: '[("first_name.keyword", 1)]',
                        max_results: 200,
                        page: 1,
                    }]);

                    expect(contactsApi.receiveContacts.callCount).toBe(1);
                    expect(contactsApi.receiveContacts.args[0][0]).toEqual(data.contacts.contacts);
                    done();
                })
                .catch(done.fail);
        });

        it('perform a text search on specific field', (done) => {
            store.test(done, contactsApi.getContacts('bob', ['organisation']))
                .then(() => {
                    expect(services.api('contacts').query.callCount).toBe(1);
                    expect(services.api('contacts').query.args[0]).toEqual([{
                        source: {
                            query: {
                                bool: {
                                    must: [{
                                        query_string: {
                                            fields: ['organisation'],
                                            query: 'bob*',
                                            default_operator: 'AND',
                                        },
                                    }],
                                    should: [
                                        {term: {is_active: true}},
                                        {term: {public: true}},
                                    ],
                                },
                            },
                        },
                        sort: '[("first_name.keyword", 1)]',
                        max_results: 200,
                        page: 1,
                    }]);

                    expect(contactsApi.receiveContacts.callCount).toBe(1);
                    expect(contactsApi.receiveContacts.args[0][0]).toEqual(data.contacts.contacts);
                    done();
                })
                .catch(done.fail);
        });

        it('restricts the search to a specific contact type', (done) => {
            store.test(done, contactsApi.getContacts('bob', [], 'stringer'))
                .then(() => {
                    expect(services.api('contacts').query.callCount).toBe(1);
                    expect(services.api('contacts').query.args[0]).toEqual([{
                        source: {
                            query: {
                                bool: {
                                    must: [{
                                        query_string: {
                                            fields: [],
                                            query: 'bob*',
                                            default_operator: 'AND',
                                        },
                                    }, {
                                        term: {contact_type: 'stringer'},
                                    }],
                                    should: [
                                        {term: {is_active: true}},
                                        {term: {public: true}},
                                    ],
                                },
                            },
                        },
                        sort: '[("first_name.keyword", 1)]',
                        max_results: 200,
                        page: 1,
                    }]);

                    expect(contactsApi.receiveContacts.callCount).toBe(1);
                    expect(contactsApi.receiveContacts.args[0][0]).toEqual(data.contacts.contacts);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('fetchContactsByIds', () => {
        beforeEach(() => {
            services.api('contacts').query = sinon.spy(
                () => Promise.resolve({_items: data.contacts.contacts})
            );
            sinon.stub(contactsApi, 'receiveContacts').callsFake(() => (Promise.resolve({})));
        });

        afterEach(() => {
            restoreSinonStub(services.api('contacts').query);
            restoreSinonStub(contactsApi.receiveContacts);
        });

        it('searches for contacts by id', (done) => {
            store.test(done, contactsApi.fetchContactsByIds(['con1', 'con2']))
                .then(() => {
                    expect(services.api('contacts').query.callCount).toBe(1);
                    expect(services.api('contacts').query.args[0]).toEqual([{
                        source: {query: {terms: {_id: ['con1', 'con2']}}},
                        all: true,
                    }]);

                    expect(contactsApi.receiveContacts.callCount).toBe(1);
                    expect(contactsApi.receiveContacts.args[0]).toEqual([data.contacts.contacts]);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('getContactById', () => {
        beforeEach(() => {
            services.api('contacts').getById = sinon.spy(
                () => Promise.resolve(data.contacts.contacts[0])
            );
            sinon.stub(contactsApi, 'receiveContacts').callsFake(() => (Promise.resolve({})));
        });

        afterEach(() => {
            restoreSinonStub(services.api('contacts').getById);
            restoreSinonStub(contactsApi.receiveContacts);
        });

        it('retrieves the contact and adds it to the store', (done) => {
            const contact = data.contacts.contacts[0];

            store.test(done, contactsApi.getContactById(contact._id))
                .then(() => {
                    expect(services.api('contacts').getById.callCount).toBe(1);
                    expect(services.api('contacts').getById.args[0]).toEqual([contact._id]);

                    expect(contactsApi.receiveContacts.callCount).toBe(1);
                    expect(contactsApi.receiveContacts.args[0]).toEqual([[contact]]);
                    done();
                })
                .catch(done.fail);
        });
    });

    describe('fetchContactsFromAssignments', () => {
        beforeEach(() => {
            sinon.stub(contactsApi, 'fetchContactsByIds').callsFake(() => (Promise.resolve([])));
        });

        afterEach(() => {
            restoreSinonStub(contactsApi.fetchContactsByIds);
        });

        it('loads contacts from the assignments provided', (done) => {
            const items = [
                {assigned_to: {contact: 'con1'}},
                {assigned_to: {contact: 'con2'}},
                {assigned_to: {user: 'ident1'}},
                {assigned_to: {}},
            ];

            store.test(done, contactsApi.fetchContactsFromAssignments(items))
                .then(() => {
                    expect(contactsApi.fetchContactsByIds.callCount).toBe(1);
                    expect(contactsApi.fetchContactsByIds.args[0]).toEqual([['con1', 'con2']]);

                    done();
                })
                .catch(done.fail);
        });
    });

    describe('fetchContactsFromPlanning', () => {
        beforeEach(() => {
            sinon.stub(contactsApi, 'fetchContactsByIds').callsFake(() => (Promise.resolve([])));
        });

        afterEach(() => {
            restoreSinonStub(contactsApi.fetchContactsByIds);
        });

        it('loads contacts from the planning items provided', (done) => {
            const items = [
                {coverages: [{assigned_to: {contact: 'con1'}}]},
                {coverages: [{assigned_to: {contact: 'con2'}}]},
                {coverages: [{assigned_to: {user: 'ident1'}}]},
                {coverages: [{assigned_to: {}}]},
            ];

            store.test(done, contactsApi.fetchContactsFromPlanning(items))
                .then(() => {
                    expect(contactsApi.fetchContactsByIds.callCount).toBe(1);
                    expect(contactsApi.fetchContactsByIds.args[0]).toEqual([['con1', 'con2']]);

                    done();
                })
                .catch(done.fail);
        });
    });
});
