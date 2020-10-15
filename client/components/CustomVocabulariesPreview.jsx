import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {Row} from './UI/Preview';

export default function CustomVocabulariesPreview({customVocabularies, item}) {
    return customVocabularies.map((cv) => {
        const values = get(item, 'subject', []).filter((item) => item.scheme === cv._id);

        if (values.length) {
            return (
                <Row
                    key={cv._id}
                    enabled={true}
                    label={cv.display_name}
                    value={values.map((item) => item.name).join(', ')}
                />
            );
        }

        return null;
    });
}

CustomVocabulariesPreview.propTypes = {
    customVocabularies: PropTypes.array.isRequired,
    item: PropTypes.object.isRequired,
};