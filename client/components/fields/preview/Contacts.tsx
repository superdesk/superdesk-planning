import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IListFieldProps} from '../../../interfaces';

import {PreviewFormItem} from './base/PreviewFormItem';
import {ContactsPreviewList} from '../../Contacts';

export class PreviewFieldContacts extends React.PureComponent<IListFieldProps> {
    render() {
        const field = this.props.field ?? 'event_contact_info';
        const contactIds = get(this.props.item, field) as Array<string>;
        const children = !contactIds?.length ? null : (
            <ContactsPreviewList
                contactIds={contactIds}
                scrollInView={true}
                scrollIntoViewOptions={{block: 'center'}}
                tabEnabled={true}
            />
        );

        return (
            <PreviewFormItem
                label={superdeskApi.localization.gettext('Contacts')}
                light={true}
                {...this.props}
            >
                {children}
            </PreviewFormItem>
        );
    }
}
