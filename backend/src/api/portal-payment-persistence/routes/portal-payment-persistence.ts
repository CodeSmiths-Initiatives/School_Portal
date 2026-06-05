export default {
	routes: [
		{
			method: "GET",
			path: "/payments/ledger-records",
			handler: "portal-payment-persistence.ledger",
			config: {
				auth: false,
			},
		},
		{
			method: "POST",
			path: "/payments/persist-initialized",
			handler: "portal-payment-persistence.initialized",
			config: {
				auth: false,
			},
		},
		{
			method: "POST",
			path: "/payments/persist-verified",
			handler: "portal-payment-persistence.verified",
			config: {
				auth: false,
			},
		},
	],
};
