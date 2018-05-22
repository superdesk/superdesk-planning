module.exports = {
    dist: {
        files: [{
            dot: true,
            src: ['<%= tmpDir %>'],
        }],
    },
    server: {
        files: '<%= tmpDir %>',
    },
};
