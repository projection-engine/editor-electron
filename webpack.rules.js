module.exports = [
    // REACT
    {
        test: /\.worker\.js$/,
        use: { loader: "worker-loader" },
    },
    {
        test: /\.wasm$/,
        loader: 'raw-loader',
    },
    {
        test: /\.jsx?$/,
        use: {
            loader: 'babel-loader',
            options: {
                exclude: /node_modules/,
                presets: [
                    "@babel/preset-env",
                    ["@babel/preset-react", {"runtime": "automatic"}]
                ],
                "plugins": [
                    "@babel/plugin-transform-async-to-generator",
                    "@babel/plugin-transform-regenerator",
                    ["@babel/plugin-transform-runtime", {
                        "helpers": true,
                        "regenerator": true
                    }]
                ]
            }
        },
        resolve: {
            extensions: ['', '.js', '.jsx'],
        }
    },
    {
        test: /\.(jpe?g|png|gif|woff|woff2|otf|eot|ttf|svg)(\?[a-z0-9=.]+)?$/,
        use: [
            {
                loader: 'url-loader',
                options: {
                    limit: 1000,
                    name: 'assets/img/[name].[ext]'
                }
            }
        ]
    },
    {
        test: /native_modules\/.+\.node$/,
        use: 'node-loader',
    },
    {
        test: /\.(m?js|node)$/,
        parser: {amd: false},
        use: {
            loader: '@vercel/webpack-asset-relocator-loader',
            options: {
                outputAssetBase: 'native_modules',
            },
        },
    },
];
