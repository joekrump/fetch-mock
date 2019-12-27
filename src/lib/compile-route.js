const generateMatcher = require('./generate-matcher');


const isUrlMatcher = matcher => matcher instanceof RegExp || typeof matcher === 'string' || (typeof matcher === 'object' && 'href' in matcher)

const sanitizeRoute = route => {
	route = Object.assign({}, route);

	if (route.method) {
		route.method = route.method.toLowerCase();
	}
	if (isUrlMatcher(route.matcher)) {
		route.url = route.matcher
		delete route.matcher;
	}
	route.identifier = route.name || route.url;
	route.functionMatcher = route.matcher || route.functionMatcher;
	return route;
};

const matcherTypes = ['query', 'method', 'headers', 'params', 'body', 'functionMatcher', 'url']

const validateRoute = route => {
	if (!('response' in route)) {
		throw new Error('fetch-mock: Each route must define a response');
	}

	if (!matcherTypes.some(matcherType => matcherType in route)) {
		throw new Error(
			'fetch-mock: Each route must specify a string, regex or function to match calls to fetch'
		);
	}
};

const limitMatcher = route => {
	if (!route.repeat) {
		return;
	}

	const matcher = route.matcher;
	let timesLeft = route.repeat;
	route.matcher = (url, options) => {
		const match = timesLeft && matcher(url, options);
		if (match) {
			timesLeft--;
			return true;
		}
	};
	route.reset = () => (timesLeft = route.repeat);
};

const delayResponse = route => {
	const { delay } = route;
	if (delay) {
		const response = route.response;
		route.response = () =>
			new Promise(res => setTimeout(() => res(response), delay));
	}
};

module.exports = route => {
	route = sanitizeRoute(route);
	validateRoute(route);
	route.matcher = generateMatcher(route);
	limitMatcher(route);
	delayResponse(route);
	return route;
};

module.exports.sanitizeRoute = sanitizeRoute;
