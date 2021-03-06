/* global Module */

/* Magic Mirror
 * Module: MMM-SNMP-NAS-SYNOLOGY
 *
 * By {{AUTHOR_NAME}}
 * {{LICENSE}} Licensed.
 */

Module.register("MMM-SNMP-NAS-SYNOLOGY", {
	defaults: {
		updateInterval: 60000,
		retryDelay: 5000
	},

	requiresVersion: "2.16.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		this.loaded = false;

		// Schedule update timer.
		this.getData();
		setInterval(function() {
			self.updateDom();
		}, this.config.updateInterval);
	},

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 *
	 */
	getData: function() {
		
		var self = this;

		var snmp = require ("lib/net-snmp");

		var options = {
			port: 161,
			retries: 1,
			timeout: 5000,
			backoff: 1.0,
			transport: "udp4",
			trapPort: 162,
			version: snmp.Version1,
			backwardsGetNexts: true,
			idBitsSize: 32
		};

		var session = snmp.createSession ("192.168.1.10", "perso", options);
		var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0"];


		session.get (oids, function (error, varbinds) {
			if (error) {
				console.error (error);
			} else {
				for (var i = 0; i < varbinds.length; i++) {
					if (snmp.isVarbindError (varbinds[i])) {
						console.error (snmp.varbindError (varbinds[i]));
					} else {
						console.log (varbinds[i].oid + " = " + varbinds[i].value);
					}
				}
			}
			session.close ();
		});

		
		
		session.trap (snmp.TrapType.LinkDown, function (error) {
			if (error) {
				console.error (error);
			}
		});
		
	},


	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	getDom: function() {
		var self = this;

		// create element wrapper for show into the module
		var wrapper = document.createElement("div");
		// If this.dataRequest is not empty
		if (this.dataRequest) {
			var wrapperDataRequest = document.createElement("div");
			// check format https://jsonplaceholder.typicode.com/posts/1
			wrapperDataRequest.innerHTML = this.dataRequest.title;

			var labelDataRequest = document.createElement("label");
			// Use translate function
			//             this id defined in translations files
			labelDataRequest.innerHTML = this.translate("TITLE");


			wrapper.appendChild(labelDataRequest);
			wrapper.appendChild(wrapperDataRequest);
		}

		// Data from helper
		if (this.dataNotification) {
			var wrapperDataNotification = document.createElement("div");
			// translations  + datanotification
			wrapperDataNotification.innerHTML =  this.translate("UPDATE") + ": " + this.dataNotification.date;

			wrapper.appendChild(wrapperDataNotification);
		}
		return wrapper;
	},

	getScripts: function() {
		return [];
	},

	getStyles: function () {
		return [
			"{{MODULE_NAME}}.css",
		];
	},

	// Load translations files
	getTranslations: function() {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	processData: function(data) {
		var self = this;
		this.dataRequest = data;
		if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
		this.loaded = true;

		// the data if load
		// send notification to helper
		this.sendSocketNotification("{{MODULE_NAME}}-NOTIFICATION_TEST", data);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "{{MODULE_NAME}}-NOTIFICATION_TEST") {
			// set dataNotification
			this.dataNotification = payload;
			this.updateDom();
		}
	},
});
