module.exports = {
    parser: '@babel/eslint-parser',
    plugins: ['prettier'],
    rules: {
        // 'prettier/prettier': 'error',
    },
    env: {
        browser: false,
        node: false,
    },
};
