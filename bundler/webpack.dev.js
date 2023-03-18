const { merge } = require('webpack-merge');
const commonConfiguration = require('./webpack.common.js');
const portFinderSync = require('portfinder-sync');
const fs = require('fs');
const path = require('path');

const { SSL_CRT_FILE, SSL_KEY_FILE } = process.env;
const appDirectory = fs.realpathSync(process.cwd());

const readFileOrNull = (file, envKey) => {
	if (!fs.existsSync(file)) {
		console.warn(`File ${file} declared in ${envKey} is missing`);
		return null;
	}
	return fs.readFileSync(file);
};

const sslConfig = () => {
	if (!SSL_CRT_FILE || !SSL_KEY_FILE) {
		return {};
	}

	const certFile = path.resolve(appDirectory, SSL_CRT_FILE);
	const keyFile = path.resolve(appDirectory, SSL_KEY_FILE);
	const cert = readFileOrNull(certFile, 'SSL_CRT_FILE');
	const key = readFileOrNull(keyFile, 'SSL_KEY_FILE');

	if (cert === null || key === null) {
		return {};
	}

	return { cert, key };
};

module.exports = merge(
    commonConfiguration,
    {
        mode: 'development',
        devServer: {
            host: '0.0.0.0',
            port: portFinderSync.getPort(8080),
            static: {
                directory: path.resolve(__dirname, 'dist'),
                watch: true
            },
            open: true,
            host: "local-ip",
            allowedHosts: 'all',
            headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': '*',
			},
            server: {
                type: 'https',
                options: sslConfig(),
            },
            client: {
                overlay: true,
            },
          }
    }    
)