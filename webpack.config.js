const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

const babelPresets = [[
	require.resolve("@babel/preset-env"),
	{
		"modules": false,
		"useBuiltIns": "usage",
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

module.exports = {
	mode: 'development',
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
		'RestApi': 'IrisRestApiClient', //https://github.com/nRFCloud/gateway-cordova/blob/master/www/index.bundle.js
		'AWS': 'AWS',
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".json"],
		modules: [
			path.resolve('app'),
			'node_modules',
		],
		mainFields: ['module', 'browser', 'main'],
	},
	plugins: [
		new webpack.EnvironmentPlugin({...process.env}),
		new Dotenv()
	],
	optimization: {
		concatenateModules: true,
	}
};
