import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IPlace, IListFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Tag} from 'superdesk-ui-framework/react';
import {PreviewFormItem} from './base/PreviewFormItem';
import {getVocabularyItemNames} from '../../../utils/vocabularies';
import * as selectors from '../../../selectors';

interface IProps extends IListFieldProps {
    places: Array<IPlace>;
    testId?: string;
    renderEmpty?: boolean;
}

const mapStateToProps = (state) => ({
    places: selectors.vocabs.locators(state),
});

/**
 * Place values render as read-only pills when the `locators` vocabulary
 * is multi selection (like the editor field), as plain text otherwise.
 */
export const PreviewFieldPlaceComponent: React.FunctionComponent<IProps> = (props) => {
    const {gettext} = superdeskApi.localization;
    const label = gettext('Places');
    const names = getVocabularyItemNames(
        get(props.item, props.field ?? 'place') ?? [],
        props.places,
        'qcode',
        'name',
        props.language,
    );

    if (names.length === 0) {
        return (
            <PreviewFormItem
                testId={props.testId}
                label={label}
                light={true}
                renderEmpty={props.renderEmpty}
            />
        );
    }

    const vocabulary = superdeskApi.entities.vocabulary?.getVocabulary('locators');

    if (vocabulary?.selection_type !== 'multi selection') {
        return (
            <PreviewFormItem
                testId={props.testId}
                label={label}
                light={true}
                value={names.join(', ')}
            />
        );
    }

    return (
        <PreviewFormItem
            testId={props.testId}
            label={label}
            light={true}
            renderEmpty={true}
        >
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 'var(--space--0-5)'}}>
                {names.map((name, index) => (
                    <Tag
                        key={index}
                        text={name}
                        readOnly={true}
                    />
                ))}
            </div>
        </PreviewFormItem>
    );
};

export const PreviewFieldPlace = connect(mapStateToProps)(PreviewFieldPlaceComponent);
