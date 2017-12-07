import React from 'react';
import {gettext} from '../../utils';

export const HistoryTab = () => {
    const items = [
        {
            _id: 1,
            author: 'Mika',
            created: new Date(),
        },
    ];

    return (
        <ul className="simple-list simple-list--dotted simple-list--no-padding">
            {items.map((item) => (
                <li className="simple-list__item" key={item._id}>
                    <p>{gettext('Created by {{ name }}', {name: item.author})}</p>
                    <time className="small">{item.created.toLocaleString()}</time>
                </li>
            ))}
        </ul>
    );
};
