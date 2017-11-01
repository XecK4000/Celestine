if(typeof browser != 'undefined') {
	CHROME_COMPATIBILITY = false;
} else {
	browser = chrome;
	CHROME_COMPATIBILITY = true;
}

function saveOptions(e) {
	browser.storage.sync.set({
		id: document.getElementById('id').value,
		server: document.getElementById('server').value
	});
	e.preventDefault();
}

function restoreOptions() {
	if(CHROME_COMPATIBILITY) {
		browser.storage.sync.get(['id', 'server'], function(items) {
			if(typeof items.id != 'undefined') {
				document.getElementById('id').value = items.id;
			}
			if(typeof items.server != 'undefined') {
				document.getElementById('server').value = items.server;
			}
		});
	} else {
		browser.storage.sync.get(['id', 'server']).then(function(items) {
			if(typeof items.id != 'undefined') {
				document.getElementById('id').value = items.id;
			}
			if(typeof items.server != 'undefined') {
				document.getElementById('server').value = items.server;
			}
		}, function(error) {
			console.log(error);
		});
	}
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('form').addEventListener('submit', saveOptions);