const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const TerserPlugin = require('terser-webpack-plugin');

const babelPresets = [[
	require.resolve("@babel/preset-env"),
	{
		"modules": false,
		"useBuiltIns": "usage",
		"corejs": 3,
		forceAllTransforms: true
	}
],
require.resolve('@babel/preset-react'),
];
const babelPlugins = [
	'@babel/plugin-external-helpers',
	'@babel/plugin-transform-runtime',
	"@babel/plugin-proposal-class-properties",
	"@babel/plugin-proposal-object-rest-spread",
	"@babel/plugin-transform-async-to-generator"
].map(require.resolve);

module.exports = async env => {
	const isProd = env.NODE_ENV === 'production';
	const optimization = {
		concatenateModules: true,
	};
	if (isProd) {
		console.log('IS PRODUCTION!!!!');
		optimization.minimizer = [new TerserPlugin({
			extractComments: {
				condition: true,
				banner: false,
				filename: '../../junk.js',
			},
			parallel: true,
			cache: true,
			terserOptions: {
				safari10: true,
				comments: false,
			}
		})];
	}
	return {
		mode: isProd ? 'production' : 'development',
		entry: [
			path.resolve(__dirname, 'helpers.js'),
			'./app/index.tsx'
		],
		output: {
			filename: 'index.js',
			path: path.resolve(__dirname, 'www/js'),
			libraryTarget: 'this'
		},
		devtool: "inline-source-map",
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /(node_modules|bower_components|helpers)/,
					loader: 'babel-loader',
					options: {
						presets: babelPresets,
						plugins: babelPlugins,
					},
				},
				{
					test: /\.tsx?$/,
					exclude: /(node_modules|bower_components|helpers)/,
					loader: [
						{
							loader: 'babel-loader',
							options: {
								presets: babelPresets,
								plugins: babelPlugins,
							},
						}, {
							loader: 'ts-loader',
							options: {
								transpileOnly: true
							}
						}
					]
				},
				{
					test: /\.scss$/,
					loader: ['style-loader', 'css-loader', {
						loader: 'sass-loader', options: {
							implementation: require('sass')
						}
					}]
				}
			]

		},
		node: {
			tls: 'empty',
			fs: 'empty'
		},
		resolve: {
			extensions: [".webpack.js", ".web.js", '.mjs', ".ts", ".tsx", ".js", ".json"],
			modules: [
				path.resolve('app'),
				'node_modules',
			],
			mainFields: ['module', 'browser', 'main'],
		},
		plugins: [
			new webpack.LoaderOptionsPlugin({
				debug: false
			}),
			new webpack.EnvironmentPlugin({ ...process.env }),
			new Dotenv()
		],
		optimization: optimization
	};
};
