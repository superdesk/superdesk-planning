import * as React from 'react';
import {Spacer, Modal, Button} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../superdeskApi';

export function confirmAddingRelatedItems(
    warnings: Array<string>,
    attemptedToAdd: number,
    canBeAdded: number,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const {gettextPlural, gettext} = superdeskApi.localization;

        superdeskApi.ui.showModal((options) => {
            const closeAndReject = () => {
                options.closeModal();

                reject();
            };

            const issuesJSX = (
                <Spacer v gap="16">
                    <h3>{gettext('Issues detected:')}</h3>

                    <ul>
                        {warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                        ))}
                    </ul>
                </Spacer>
            );

            if (canBeAdded < 1) {
                return (
                    <Modal
                        visible
                        onHide={closeAndReject}
                        headerTemplate={
                            gettextPlural(
                                attemptedToAdd,
                                'Item can not be added as related',
                                'Items can not be added as related',
                            )
                        }
                        footerTemplate={(
                            <Button text={gettext('Close')} onClick={() => closeAndReject()} />
                        )}
                    >
                        {issuesJSX}
                    </Modal>
                );
            } else {
                return (
                    <Modal
                        visible
                        onHide={closeAndReject}
                        headerTemplate={
                            gettext(
                                '{{some}} of {{total}} items can not be added as related',
                                {
                                    total: attemptedToAdd,
                                    some: attemptedToAdd - canBeAdded,
                                },
                            )
                        }
                        footerTemplate={(
                            <Spacer h gap="4" justifyContent="end" noWrap>
                                <Button text={gettext('Cancel')} onClick={() => closeAndReject()} />
                                <Button
                                    text={gettextPlural(canBeAdded, 'Add 1 item', 'Add {{n}} items', {n: canBeAdded})}
                                    type="primary"
                                    onClick={() => {
                                        options.closeModal();

                                        resolve();
                                    }}
                                />
                            </Spacer>
                        )}
                    >
                        {issuesJSX}
                    </Modal>
                );
            }
        });
    });
}
