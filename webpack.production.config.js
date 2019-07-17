const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');

const babelPresets = [[
	require.resolve("babel-preset-env"),
	{
		"modules": false,
		"useBuiltIns": "usage",
		forceAllTransforms: true
	}
],
	require.resolve('babel-preset-react'),
];

const babelPlugins = [
	'babel-plugin-external-helpers',
	'babel-plugin-transform-runtime',
	"babel-plugin-transform-class-properties",
	"babel-plugin-transform-object-rest-spread",
	"babel-plugin-transform-async-to-generator"
].map(require.resolve);

module.exports = {
	mode: 'production',
	entry: [
		path.resolve(__dirname, 'helpers.js'),
		'babel-polyfill',
		'./app/index.tsx'
	],
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'www/js'),
		libraryTarget: 'this'
	},
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
				loaders: [
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
				loaders: ['style-loader', 'css-loader', {
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
	externals: {
		'aws-wrapper': 'awsWrapper',
		'RestApi': 'IrisRestApiClient',
		'AWS': 'AWS',
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".json"],
		modules: [
			path.resolve('app'),
			'node_modules',
		]
	},
	plugins: [
		new webpack.LoaderOptionsPlugin({
			debug: false
		}),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production')
		}),
		new Dotenv()
	],
	optimization: {
		concatenateModules: true,
		minimizer: [new TerserPlugin({
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
		})]
	}
};
