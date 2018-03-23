
const capitalize = (string) => !string ? '' : string.charAt(0).toUpperCase() + string.slice(1);

// eslint-disable-next-line consistent-this
const self = {
    capitalize
};

export default self;
