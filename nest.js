"use strict";

var axios = require('axios');

var _auth = {};
var _status_url = "";
var _status_payload = {};

exports.login = (email, password) => {
	// setup login post request
	let p1 = axios.post('https://home.nest.com/user/login', {
		'email': email,
		'password': password
	}, {
		headers: {
			'user-agent': 'Nest/2.1.3 CFNetwork/548.0.4',
			'X-nl-protocol-version': '1',
			'Content-Type': 'application/json'
		}
	});
	// return mapped promise
	return p1.then((resp) => {
		// parse user and access tokens
		_auth = {
			user: resp.data.user,
			access_token: resp.data.access_token
		};
		// parse transport url into status url
		_status_url = resp.data.urls.transport_url + '/v2/mobile/' + _auth.user;
		// store status payload
		_status_payload = resp.data;
		// return auth and status urls
		return {
			auth: _auth,
			status_url: _status_url
		}
	});
}

exports.login_from_cache = (cache) => {
	// load from cache
	_auth = cache.auth;
	_status_url = cache.status_url;
}

exports.get_thermostat_data = () => {
	if (_auth === {}) {
		throw new Error('missing auth');
	}
	// setup get request
	let p1 = axios.get(_status_url, {
		headers: {
			'X-nl-user-id': _auth.user,
			'Authorization': 'Basic ' + _auth.access_token,
			'user-agent': 'Nest/2.1.3 CFNetwork/548.0.4',
			'X-nl-protocol-version': '1'
		}
	});
	// return mapped promise
	return p1.then((resp) => {
		let devices_data = [];
		// loop through shared data and map
		for (let device_key in resp.data.shared) {
			let device_data = resp.data.shared[device_key];
			devices_data.push({
				"device_key": device_key,
				"target_temperature": device_data["target_temperature"],
				"current_temperature": device_data["current_temperature"],
				"hvac_ac_state": device_data["hvac_ac_state"],
				"hvac_heater_state": device_data["hvac_heater_state"]
			});
		}
		// return all device data
		return devices_data;
	});
}
