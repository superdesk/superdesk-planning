import React from 'react';
import {gettext} from 'superdesk-core/scripts/core/utils';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';

type Term = {[key: string]: any};

interface IProps {
    terms?: Array<Term>;
    displayField?: string;
    onClick?(index: number, term: Term): void;
    readOnly?: boolean;
    language?: string;
}

export default class TermsList extends React.PureComponent<IProps> {
    render() {
        const {
            terms,
            displayField = 'name',
            onClick,
            readOnly = false,
            language,
        } = this.props;

        if (!terms?.length) {
            return null;
        }

        const classes = readOnly ?
            'terms-list terms-list--disabled' :
            'terms-list';
        const clickEnabled = !readOnly && onClick != null;

        return (
            <div className={classes}>
                <ul>
                    {terms.map((term, index) => (
                        <li
                            key={index}
                            onClick={clickEnabled ?
                                () => onClick(index, term) :
                                null
                            }
                        >
                            {getVocabularyItemFieldTranslated(term, displayField, language) || term}
                            {!clickEnabled ? null : (
                                <i className="icon-close-small" role="button" aria-label={gettext('Remove')} />
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}
