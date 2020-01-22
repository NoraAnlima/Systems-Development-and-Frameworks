module.exports = {
    root: true,
    env: {
        browser: true,
        node: true
    },
    parserOptions: {
        parser_original: "babel-eslint",
        parser: "@typescript-eslint/parser"
    },
    extends: [
        "@nuxtjs/eslint-config-typescript",
        "plugin:vue/recommended",
        "plugin:nuxt/recommended"
    ],
    // add your custom rules here
    rules: {
        "indent": ["warn", 4],
        "space-before-function-paren": ["error", "never"],
        "semi": ["error", "always"],
        "quotes": ["error", "double"],
        "object-curly-spacing": ["error", "never"],
        "vue/script-indent": ["error", 4, {"baseIndent": 1}],
        "vue/html-indent": ["error", 4, {
            "attribute": 1,
            "baseIndent": 1,
            "closeBracket": 0,
            "alignAttributesVertically": false,
            "ignores": []
        }]
    },
    overrides: [
        {
            files: [
                "**/__tests__/*.{j,t}s?(x)",
                "**/tests/unit/**/*.spec.{j,t}s?(x)",
            ],
            env: {
                jest: true
            }
        },
        {
            files: [
                "*.vue"
            ],
            rules: {
                indent: "off"
            }
        }
    ]
};
