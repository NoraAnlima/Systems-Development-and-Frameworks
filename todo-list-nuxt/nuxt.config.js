export default {
    mode: "spa",
    /*
    ** Headers of the page
    */
    head: {
        title: process.env.npm_package_name || "",
        meta: [
            {charset: "utf-8"},
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1"
            },
            {
                hid: "description",
                name: "description",
                content: process.env.npm_package_description || ""
            }
        ],
        link: [
            {
                rel: "icon",
                type: "image/x-icon",
                href: "/favicon.ico"
            }
        ]
    },
    /*
    ** Customize the progress-bar color
    */
    loading: {color: "#fff"},
    /*
    ** Global CSS
    */
    css: [],
    /*
    ** Plugins to load before mounting the App
    */
    plugins: [],
    /*
    ** Nuxt.js dev-modules
    */
    buildModules: [
        // Doc: https://github.com/nuxt-community/eslint-module
        "@nuxtjs/eslint-module",
        "@nuxt/typescript-build"
    ],
    /*
    ** Nuxt.js modules
    */
    modules: [
        "@nuxtjs/apollo"
    ],
    /*
    ** Build configuration
    */
    build: {
        /*
        ** You can extend webpack config here
        */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extend(config, ctx) {
        }
    },

    apollo: {
        authenticationType: "",
        // watchLoading: '~/plugins/apollo-watch-loading-handler.js',
        // errorHandler: '~/plugins/apollo-error-handler.js',
        // required
        clientConfigs: {
            default: {
                // required
                httpEndpoint: "http://localhost:4000",
                // browserHttpEndpoint: "/graphql",
                //wsEndpoint: "ws://localhost:4000"
                wsEndpoint: null
            }
        }
    }
};
