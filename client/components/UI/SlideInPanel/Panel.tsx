import React from 'react';

/**
 * @ngdoc react
 * @name Panel
 * @description Main panel of a slide-in panel
 */
export const Panel = ({children}: {children: React.ReactNode}) => (
    <div className="sd-column-box__slide-in-column-inner sd-slide-in-panel">
        {children}
    </div>
);
