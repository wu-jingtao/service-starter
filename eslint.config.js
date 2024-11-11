const sufu = require('eslint-config-sufu');

module.exports = [
    ...sufu['ts'],
    {
        rules: {
            /**
             * 添加自定义规则
             */
        }
    }
];
