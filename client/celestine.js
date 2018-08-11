"use strict";

//Object to store everything
var OWL = {
	USER_ID: '',
	API_PATH: '',
	UNIQUE_ID: new Date().getTime()+Math.random(),
	SERVER_DELAY: 1000,			//Local server loop
	WEBSERVER_DELAY: 60000,		//Web server call loop
	WEBSERVER_LAST: new Date().getTime(),
	DATA: {
		owls: {}
	},
	SERVER_DATA: {},
	ANIMATIONS : {
		still: 14,
		jump: 8,
		laid: 1,
		laidBlink: 5,
		laidPos: 12,
		landing: 13,
		takeoff: 13
	},
	DOM: {},
	TIMER: {},
	IS_READY: true
};
OWL.WEBSERVER_LAST -= OWL.WEBSERVER_DELAY;

/**************************************************************************************************/
/*                                         INITIALISATION                                         */
/**************************************************************************************************/
// Initialization of the script
OWL.initialize = function() {
	if(!OWL.IS_SERVER()) {
		OWL.IS_READY = false;
		OWL.c_init_dom();
		OWL.send_server('init');
	}
	if(!OWL.IS_EXTENSION) {
		OWL.USER_ID = document.getElementById('owl_id').innerHTML;
		OWL.API_PATH = document.getElementById('owl_api').innerHTML;
		window.addEventListener('storage', OWL.receive_storage);
		setInterval(OWL.check_server, OWL.SERVER_DELAY);
		OWL.check_server();
	} else {
		if(OWL.IS_CHROME) {
			browser.storage.sync.get(['id', 'server'], function(items) {
				if(typeof items.id != 'undefined') {
					OWL.USER_ID = items.id;
				}
				if(typeof items.server != 'undefined') {
					OWL.API_PATH = items.server;
				}
			});
		} else {
			browser.storage.sync.get(['id', 'server']).then(function(items) {
				if(typeof items.id != 'undefined') {
					OWL.USER_ID = items.id;
				}
				if(typeof items.server != 'undefined') {
					OWL.API_PATH = items.server;
				}
			}, function(error) {
				console.log(error);
			});
		}
		if(OWL.IS_SERVER()) {
			browser.runtime.onMessage.addListener(OWL.s_receive);
			setInterval(OWL.s_update,OWL.SERVER_DELAY);
			OWL.s_update();
		} else {
			browser.runtime.onMessage.addListener(OWL.c_receive);
		}
	}
};

//Identify the context of the script
if(typeof browser != 'undefined') {
	OWL.IS_EXTENSION = true;
	OWL.IS_CHROME = false;
} else if(typeof chrome.i18n != 'undefined') {
	var browser = chrome;
	OWL.IS_EXTENSION = true;
	OWL.IS_CHROME = true;
} else {
	var browser = undefined;
	OWL.IS_EXTENSION = false;
}

//Check if server or not
OWL.IS_SERVER = function() {
	if(OWL.IS_EXTENSION) {
		return typeof browser.tabs != 'undefined';
	} else {
		return localStorage.getItem('SERVER_ID') == OWL.UNIQUE_ID;
	}
};

if(OWL.IS_EXTENSION) {
	setTimeout(OWL.initialize, 100);
} else {
	window.addEventListener('load', OWL.initialize);
}






/**************************************************************************************************/
/*                                   SYNCHRONISATION FUNCTIONS                                    */
/**************************************************************************************************/
//For script's version only update the server status
OWL.check_server = function() {
	//If the server is still up, warn the others
	if(OWL.IS_SERVER()) {
		localStorage.setItem('SERVER_TIME', new Date().getTime());
	}
	//If the server is down, replace it
	else if(typeof(localStorage.getItem('SERVER_TIME')) === 'undefined'
			|| (new Date().getTime()-localStorage.getItem('SERVER_TIME') > OWL.SERVER_DELAY*2 && OWL.IS_READY)
			|| (new Date().getTime()-localStorage.getItem('SERVER_TIME') > OWL.SERVER_DELAY*4 && !OWL.IS_READY)) {
		localStorage.setItem('SERVER_ID', OWL.UNIQUE_ID);
		localStorage.setItem('SERVER_TIME', new Date().getTime());
		if(!OWL.IS_READY) {
			OWL.c_init(OWL.DATA);
			OWL.IS_READY = true;
		}
		console.log('Server created ID: '+OWL.UNIQUE_ID);
		setInterval(OWL.s_update,OWL.SERVER_DELAY);
		OWL.s_update();
	}
	//If still not a ready client, request for an init
	else if(!OWL.IS_READY) {
		OWL.send_server('init');
	}
};

//Send a message to the server
OWL.send_server = function(type, details) {
	if(typeof details == 'undefined') {
		details = {};
	}
	if(OWL.IS_EXTENSION) {
		browser.runtime.sendMessage(
			{'type': type, 'details': details, 'time': new Date().getTime()},
		);
	} else {
		localStorage.setItem('MESSAGE_TO_SERVER', JSON.stringify({'type': type, 'details': details, 'time': new Date().getTime()}));
		if(OWL.IS_SERVER()) {
			OWL.s_receive_data({'type': type, 'details': details, 'time': new Date().getTime()});
		}
	}
};

//Send a message to the clients
OWL.send_client = function(type, details) {
	if(typeof details == 'undefined') {
		details = {};
	}
	if(OWL.IS_EXTENSION) {
		browser.tabs.query({}, function(tabs) {
			for (var tab of tabs) {
				browser.tabs.sendMessage(
					tab.id,
					{'type': type, 'details': details, 'time': new Date().getTime()}
				);
			}
		});
	} else {
		localStorage.setItem('MESSAGE_TO_CLIENT', JSON.stringify({'type': type, 'details': details, 'time': new Date().getTime()}));
		OWL.c_receive_data({'type': type, 'details': details, 'time': new Date().getTime()});
	}
};

//Identification of the current script
OWL.papers_please = function(text) {
	console.log((text?text:'')+"I'm just a simple "+(OWL.IS_EXTENSION?"extension":"script")+"'s "+(OWL.IS_SERVER()?"server":"client")+" trying to make my way in the universe.");
};

//Event handlers for communication
OWL.receive_storage = function(response) {
	if(response.key == 'MESSAGE_TO_SERVER' && OWL.IS_SERVER()) {
		OWL.s_receive_data(JSON.parse(response.newValue));
	} else if(response.key == 'MESSAGE_TO_CLIENT' && !OWL.IS_SERVER()) {
		OWL.c_receive_data(JSON.parse(response.newValue));
	}
};
OWL.s_receive = function(response, sender, sendResponse) {
	OWL.s_receive_data(response);
};
OWL.c_receive = function(response, sender, sendResponse) {
	OWL.c_receive_data(response);
};


OWL.get_url = function(url) {
	if(OWL.IS_EXTENSION) {
		return browser.extension.getURL('ressources/'+url);
	} else {
		return 'https://zbug.fr/celestine/client/ressources/'+url;
	}
}














/**************************************************************************************************/
/*                                     APPLICATION FUNCTIONS                                      */
/**************************************************************************************************/
OWL.c_init_dom = function() {
	$('body').append(OWL.DOM.PARENT = $('<div>').css({zIndex: 1111111}));
	$('body').append(OWL.DOM.BUTTON_DISPLAY = $('<img>', {src: OWL.get_url('btn_on.png'), width: '35px'}).css({zIndex: 1111111, position: 'absolute', right: '0px', top: '0px'}).click(OWL.c_toggle).hover(OWL.c_enter_button, OWL.c_leave_button));
	OWL.DOM.PARENT.append(OWL.DOM.INFORMATION_BOARD = $('<div>').css({zIndex: 1111111, display: 'none', position: 'absolute', right: '0px', top: '35px', border: '1px solid #7C6D8E', backgroundColor: 'rgba(255,255,255,0.5)', padding: '2px 4px', margin: '5px'}));
	OWL.c_update();
}

OWL.c_update = function() {
	var current_time = new Date().getTime();
	for(var owl_id in OWL.DATA.owls) {
		var current_owl = OWL.DATA.owls[owl_id];
		if($('#owl'+owl_id).length == 0) {
			OWL.DOM.PARENT.append($('<img>', {
				id: 'owl'+owl_id,
				class: 'owl'
			}).css({
				position: 'fixed',
				zIndex: 11111111,
				width: current_owl.SIZE,
				left: current_owl.POSITION.x,
				top: current_owl.POSITION.y,
			}));
		}
		var current_animation = current_owl.ANIMATION,
			new_image = OWL.get_url(current_animation.NAME+'_'+(Math.trunc((current_time-current_animation.START)/100)%OWL.ANIMATIONS[current_animation.NAME])+'.png');
		//TODO Ca RAME BORDEL !!
		if(document.getElementById('owl'+owl_id).src != new_image) {
			document.getElementById('owl'+owl_id).src = new_image;
		}
		if(current_owl.ROTATION) {
			$('#owl'+owl_id).css('transform', 'scaleX(-1)');
		} else {
			$('#owl'+owl_id).css('transform', 'initial');
		}

		var current_action = current_owl.ACTION;
		switch(current_action.NAME) {
			case 'MOVE':
				if(current_time > current_action.END) {
					$('#owl'+owl_id).css({
						left: current_action.POSITION.x,
						top: current_action.POSITION.y
					});
				} else {
					var t = (current_time - current_action.START)/(current_action.END - current_action.START);
					//TODO Ca RAME BORDEL !!
					document.getElementById('owl'+owl_id).style.left = (current_owl.POSITION.x + (current_action.POSITION.x-current_owl.POSITION.x)*t)+'px';
					document.getElementById('owl'+owl_id).style.top = (current_owl.POSITION.y + (current_action.POSITION.y-current_owl.POSITION.y)*t)+'px';
					/*$('#owl'+owl_id).css({
						left: current_owl.POSITION.x + (current_action.POSITION.x-current_owl.POSITION.x)*t,
						top: current_owl.POSITION.y + (current_action.POSITION.y-current_owl.POSITION.y)*t
					});*/
				}
				break;
			default:
				$('#owl'+owl_id).css({
					left: current_owl.POSITION.x,
					top: current_owl.POSITION.y
				});
				break;
		}
	}
	//setTimeout(OWL.c_update, 50);
	requestAnimationFrame(OWL.c_update);
}

//Initialize on client side - generate every dom from data
OWL.c_init = function(data) {
	OWL.IS_READY = true;
	OWL.DATA = data;

	OWL.c_update_information_board(OWL.DATA.INFORMATION_BOARD);
};

OWL.c_show = function() {
	OWL.DOM.PARENT.css('display', 'block');
	OWL.DOM.BUTTON_DISPLAY.prop('src', OWL.get_url('btn_on.png'));
};
OWL.c_hide = function() {
	OWL.DOM.PARENT.css('display', 'none');
	OWL.DOM.BUTTON_DISPLAY.prop('src', OWL.get_url('btn_off.png'));
};
OWL.c_toggle = function() {
	if(OWL.DOM.PARENT.css('display') != 'none') {
		OWL.send_server('hide');
	} else {
		OWL.send_server('show');
	}
};

OWL.c_enter_button = function() {
	OWL.TIMER.INFORMATION_BOARD = setTimeout(function() {
		OWL.DOM.INFORMATION_BOARD.show();
	}, 500);
};
OWL.c_leave_button = function() {
	clearTimeout(OWL.TIMER.INFORMATION_BOARD);
	OWL.DOM.INFORMATION_BOARD.hide();
};

// Server update: Update current data informations by contacting distant server
OWL.s_update = function() {
	//On fait un appel au serveur si pas d'appel depuis OWL.WEBSERVER_DELAY
	if(new Date().getTime()-OWL.WEBSERVER_LAST > OWL.WEBSERVER_DELAY) {
		OWL.WEBSERVER_LAST = new Date().getTime();
		$.ajax({
			url : OWL.API_PATH+'?back_user='+OWL.USER_ID+'&action=server_update',
			dataType : 'json',
			method : 'GET'
		}).done(function(data) {
			//Display locations of owls
			if(data.locations) {
				var content = '';
				for(var chouette_id in data.locations) {
					content += data.locations[chouette_id].chouette_name + ' -> ' + data.locations[chouette_id].user_name + '<br />';
				}
				if(content != OWL.DATA.INFORMATION_BOARD) {
					OWL.DATA.INFORMATION_BOARD = content;
					OWL.send_client('update_information_board', content);
				}
			}
			if(data.create && data.create.chouette_id && !OWL.DATA.owls[data.create.chouette_id]) {
				OWL.s_create_owl[data.create.chouette_id];
			}
			if(data.current) {
				for(var owl_id in OWL.DATA.owls) {
					if(!data.current[owl_id]) {
						OWL.DATA.owls[owl_id].NEXT_ACTION = 'LEAVE';
					}
				}
				for(var owl_id in data.current) {
					if(!OWL.DATA.owls[owl_id]) {
						OWL.s_create_owl(owl_id);
					}
				}
				/*
				//Check if all owls are still here
				for(var owl_id in DATA.owls) {
					if(!data.current[owl_id]) {
						DATA.owls[owl_id].leave();
					}
				}
				for(var owl_id in data.current) {
					if(!DATA.owls[owl_id]) {
						var chouette = data.current[owl_id];
						var width = parseInt(Math.random()*100+50);

						var coords = getCoordOutScreen();
						DATA.owls[chouette.chouette_id] = new Owl(chouette.chouette_id, chouette.chouette_name, width, coords.x, coords.y);
					}
				}*/
			}
		});
	}
	var current_time = new Date().getTime();
	for(var owl_id in OWL.DATA.owls) {
		var current_owl = OWL.DATA.owls[owl_id];

		var current_action = current_owl.ACTION;
		switch(current_action.NAME) {
			case 'MOVE':
				if(current_time > current_action.END) {
					OWL.DATA.owls[owl_id].POSITION = current_action.POSITION;
					OWL.DATA.owls[owl_id].ACTION = {NAME: 'NONE'};
				}
				OWL.s_send_owl(owl_id);
				break;
			case 'NONE':
				if(current_owl.NEXT_ACTION == 'NONE') {
					var r = Math.random();
					if(r < 0.2) {
						current_owl.NEXT_ACTION = 'MOVE';
					}
				}
				if(current_owl.NEXT_ACTION != 'NONE') {
					var t_next_action = current_owl.NEXT_ACTION;
					OWL.DATA.owls[owl_id].NEXT_ACTION = 'NONE';
					switch(t_next_action) {
						case 'MOVE': //Owl is going to move
							console.log('Owl '+owl_id+'-> MOVE');
							OWL.DATA.owls[owl_id].ACTION = {
								NAME: 'MOVE',
								START: new Date().getTime(),
								POSITION: OWL.get_coord_in(),
								END: new Date().getTime()+Math.random()*5000+5000
							};
							OWL.DATA.owls[owl_id].ROTATION = OWL.DATA.owls[owl_id].ACTION.POSITION.x > OWL.DATA.owls[owl_id].POSITION.x;
							break;
						case 'LEAVE': //Owl is going to leave the screen
							console.log('Owl '+owl_id+'-> LEAVE');
							OWL.DATA.owls[owl_id].ACTION = {
								NAME: 'MOVE',
								START: new Date().getTime(),
								POSITION: OWL.get_coord_out(),
								END: new Date().getTime()+Math.random()*5000+5000
							};
							OWL.DATA.owls[owl_id].ROTATION = OWL.DATA.owls[owl_id].ACTION.POSITION.x > OWL.DATA.owls[owl_id].POSITION.x;
							OWL.DATA.owls[owl_id].NEXT_ACTION = 'DISAPPEAR';
							break;
						case 'DISAPPEAR': //Owl is going to disappear
							console.log('Owl '+owl_id+'-> DISAPPEAR');
							OWL.s_remove_owl(owl_id);
							break;
					}
					OWL.s_send_owl(owl_id);
				}
				break;

		}
	}

	//Get the size of the clients
	if(typeof OWL.SERVER_DATA.SIZES == 'undefined' || new Date().getTime() > OWL.SERVER_DATA.SIZES.TIMEOUT) {
		OWL.SERVER_DATA.SIZES = {
			TIMEOUT: new Date().getTime()+10000,
			LIST: []
		};
		OWL.send_client('request_screen_size', {});
	}
};

//The server send an owl informations to the clients
OWL.s_send_owl = function(owl_id) {
	OWL.send_client('update_owl', {
		'owl_id': owl_id,
		'data': OWL.DATA.owls[owl_id]
	});
};

//The server generate a new owl
OWL.s_create_owl = function(owl_id) {
	console.log('Owl '+owl_id+': CREATED');
	OWL.DATA.owls[owl_id] = {
		SIZE: 75,
		POSITION: OWL.get_coord_out(),
		ANIMATION: {
			START: new Date().getTime(),
			NAME: 'still'
		},
		ACTION: {
			NAME: 'MOVE',
			START: new Date().getTime(),
			POSITION: OWL.get_coord_in(),
			END: new Date().getTime()+Math.random()*5000+5000
		},
		NEXT_ACTION: 'NONE'
	};
	OWL.DATA.owls[owl_id].ROTATION = OWL.DATA.owls[owl_id].ACTION.POSITION.x > OWL.DATA.owls[owl_id].POSITION.x;
};

OWL.s_remove_owl = function(owl_id) {
	console.log('Owl '+owl_id+': REMOVED');
	OWL.send_client('remove_owl', owl_id);
	delete OWL.DATA.owls[owl_id];
}

OWL.c_remove_owl = function(owl_id) {
	document.getElementById('owl'+owl_id).remove();
}

OWL.get_coord_out = function() {
	var r = Math.random();
	var win = OWL.get_coord_window();
	if(r < 0.25) {
		return {
			x: -200,
			y: parseInt(win.h*Math.random())
		};
	}
	else if(r < 0.5) {
		return {
			x: win.w + 200,
			y: parseInt(win.h*Math.random())
		};
	}
	else if(r < 0.75) {
		return {
			x: parseInt(win.w*Math.random()),
			y: -200
		};
	}
	else {
		return {
			x: parseInt(win.w*Math.random()),
			y: win.h + 200
		};
	}
};

OWL.get_coord_in = function() {
	var win = OWL.get_coord_window();
	return {
		x: parseInt((win.w-150)*Math.random()+75),
		y: parseInt((win.h-150)*Math.random()+75)
	};
};

OWL.get_coord_window = function() {
	if(OWL.IS_SERVER()) {
		if(typeof OWL.SERVER_DATA.SIZES != 'undefined' && OWL.SERVER_DATA.SIZES.length > 0) {
			var w = 0,
				h = 0;
			for(var i=0 ; i<OWL.SERVER_DATA.SIZES.LIST.length ; i++) {
				w += OWL.SERVER_DATA.SIZES.LIST[i].w;
				h += OWL.SERVER_DATA.SIZES.LIST[i].h;
			}
			w /= OWL.SERVER_DATA.SIZES.LIST.length;
			h /= OWL.SERVER_DATA.SIZES.LIST.length;
			return {
				w: parseInt(w, 10),
				h: parseInt(h, 10)
			}
		} else {
			return {
				w: 1900,
				h: 950
			};
		}
	} else {
		return {
			w: $(window).width(),
			h: $(window).height()
		};
	}
}

//The server receive data
OWL.s_receive_data = function(data) {
	switch(data['type']) {
		case 'init':
			OWL.send_client('init', OWL.DATA);
			break;
		case 'answser_screen_size':
			OWL.SERVER_DATA.SIZES.LIST.push(data['details']);
			break;
		case 'show':
			OWL.send_client('show');
			break;
		case 'hide':
			OWL.send_client('hide');
			break;
		default:
			//OWL.papers_please('s_receive_data: ');
			//console.log(data);
			break;
	}
};

//The client receive data
OWL.c_receive_data = function(data) {
	if(OWL.IS_READY) {
		switch(data['type']) {
			case 'update_information_board':
				OWL.c_update_information_board(data['details']);
				break;
			case 'update_owl':
				OWL.c_update_owl(data['details']);
				break;
			case 'remove_owl':
				OWL.c_remove_owl(data['details']);
				break;
			case 'request_screen_size':
				OWL.send_server('answser_screen_size', {
					w: $(window).width(),
					h: $(window).height()
				});
				break;
			case 'hide':
				OWL.c_hide();
				break;
			case 'show':
				OWL.c_show();
				break;
			default:
				//OWL.papers_please('c_receive_data: ');
				//console.log(data);
				break;
		}
	} else {
		if(data['type'] == 'init') {
			OWL.c_init(data['details']);
		}
	}
};

OWL.c_update_information_board = function(text) {
	OWL.DATA.INFORMATION_BOARD = text;
	OWL.DOM.INFORMATION_BOARD.html(text);
};

OWL.c_update_owl = function(data) {
	OWL.DATA.owls[data.owl_id] = data.data;
}




/*

Fonction utiles :
	send_server(type, data);
	send_client(type, data);
	papers_please();

L'objet OWL.DATA doit contenir toutes les informations nécessaires à gérer l'intégralité de l'affichage. Toutes les animations devraient être structurées basées sur une heure de début et une durée ou une heure de fin

*/
