import React from 'react';

/**
 * @ngdoc react
 * @name SlideInColumn
 * @description Vertical sliding panel component which can be used inside a column box
 */

export const SlideInColumn = ({children}: {children: React.ReactNode}) => (
    <div className="sd-column-box__slide-in-column">
        {children}
    </div>
);
