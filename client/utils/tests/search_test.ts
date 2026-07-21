import {searchInChunks} from '../search';

describe('utils.search.searchInChunks', () => {
    let searchedChunks: Array<Array<string>>;

    const search = (chunk: Array<string>) => {
        searchedChunks.push(chunk);

        return Promise.resolve(chunk.map((id) => ({_id: id})));
    };

    beforeEach(() => {
        searchedChunks = [];
    });

    it('resolves an empty list without searching', (done) => {
        searchInChunks([], search)
            .then((items) => {
                expect(items).toEqual([]);
                expect(searchedChunks).toEqual([]);
                done();
            })
            .catch(done.fail);
    });

    it('searches small id lists in a single request', (done) => {
        searchInChunks(['a', 'b', 'c'], search)
            .then((items) => {
                expect(searchedChunks).toEqual([['a', 'b', 'c']]);
                expect(items).toEqual([{_id: 'a'}, {_id: 'b'}, {_id: 'c'}]);
                done();
            })
            .catch(done.fail);
    });

    it('splits large id lists into chunks and concatenates the results in order', (done) => {
        const ids = [];

        for (let i = 0; i < 60; i++) {
            ids.push(`id-${i}`);
        }

        searchInChunks(ids, search, 25)
            .then((items) => {
                expect(searchedChunks.length).toBe(3);
                expect(searchedChunks[0].length).toBe(25);
                expect(searchedChunks[1].length).toBe(25);
                expect(searchedChunks[2].length).toBe(10);
                expect(items.length).toBe(60);
                expect(items.map((item) => item._id)).toEqual(ids);
                done();
            })
            .catch(done.fail);
    });

    it('rejects if any chunk fails', (done) => {
        const failingSearch = (chunk: Array<string>) => (
            chunk.includes('id-30') ?
                Promise.reject('search failed') :
                search(chunk)
        );
        const ids = [];

        for (let i = 0; i < 60; i++) {
            ids.push(`id-${i}`);
        }

        searchInChunks(ids, failingSearch, 25)
            .then(
                () => done.fail('Expected the promise to reject'),
                (error) => {
                    expect(error).toBe('search failed');
                    done();
                }
            );
    });
});
