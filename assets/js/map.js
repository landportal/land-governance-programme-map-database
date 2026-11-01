
"use strict";

var g_map;
var g_sublayer;

var g_polylines = [];
var g_first_circle = null;

var g_line_width = 1.7;
var g_opacity = 0.7;

var g_markers = [];
var g_popup = null;
var g_markerlist = [];

var g_funder_ids = [];
var g_status = 1;
var g_vgs = [];

// OpenStreetMap (free tiles). Attribution is shown in the page footer (attribution control is off).
var g_tilelayer1 = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	noWrap: true
});
var g_tilelayer0 = g_tilelayer1;
var g_tilelayer2 = g_tilelayer1;

var g_currentlayer = g_tilelayer1;

var isLoading = true;



$(document).ready(function() {
	set_map_height(); // run this as early as possible so that map has correct div size

	//var geo_bounds = ;
	//init_leaflet(geo_bounds);
	var geo_bounds = [[124.98046,67.067433],[-95.625,-22.26876]]; //long lat
	var geo_bounds = [[84.55,66.79],[-106.69,-22.75]]; //long lat
	init_leaflet(geo_bounds);
	//init_leaflet();
	
	var emptyslidersettings = {};
	$.accordeon('map-accordeon',emptyslidersettings,false,-1);
//	$.accordeon('map-accordeon',emptyslidersettings,false,1);
	
	$(window).resize(function() {
		set_map_height();
	});
	show_pins([],1);

	// VGGTs: level 2 click
	$('ul#vgs > li > ul > li').on('click',function() {
		if ('1' === $(this).data('selected')) {
			$(this).removeClass('selected').data('selected','0');
		} else {
			$(this).addClass('selected').data('selected','1');
		}
		get_selected_vgs();
	});
	// VGGTs: level 1 click : select/deselect all
	$('ul#vgs > li > div .cat1title').on('click',function() {
		var elt = $(this).parent().parent();
		if ('1' === elt.data('selected')) {
                        elt.removeClass('selected').data('selected','0');
                } else {
                        elt.addClass('selected').data('selected','1');
                }

		var $lis = elt.find('li');
		var found_selection = false;
		$lis.each(function() {
			if ('1' === $(this).data('selected')) {
				found_selection = true;
			}
		});
		if (found_selection) {
			$lis.removeClass('selected').data('selected','0');
		} else {
			$lis.addClass('selected').data('selected','1');
		}
		get_selected_vgs();
	});

	$('.chosen-select').chosen({
		allow_single_deselect: true,
		width: '100%'
	});
	
	var hash = window.location.hash.substring(1);
        if (hash.indexOf('programme') != -1) {
		// Load program details
		show_programmes();
	}
	
});

var get_selected_vgs = function() {
	var n = 0;
	g_vgs = [];
	$('ul#vgs > li > ul > li').each(function() {
		var $li = $(this);
		if ('1' === $li.data('selected')) {
			n++;
			g_vgs.push($li.data('vgid'));
		}
		
	});
	if (n) {
		$('#idcountervgs').html('(' + n + ' selected)');
	} else {
		$('#idcountervgs').html('');
	}
	update_pins();
};

var set_map_height = function () {
	var fh = $('#footerarea').height();
	var wh = $(window).height();
	var new_h = wh - fh - 1;
	$('#map').height(new_h);
	//$('#mapcontent').height(new_h);
	//$('#map-accordeon').css('min-height', new_h + 'px');
	$('#mapcontent').css('max-height', new_h+'px'); // adjust left content column
	return;

};
	

var init_leaflet = function(geo_bounds) {
	if (typeof geo_bounds !== 'undefined') {
		var southWest = L.latLng(geo_bounds[0][1], geo_bounds[0][0]),
			northEast = L.latLng(geo_bounds[1][1], geo_bounds[1][0]),
			bounds = L.latLngBounds(southWest, northEast);	
	}
	var centerPoint = [19.31114, 16.875];
	
	var tilelayer = g_tilelayer1;
	
	if (typeof bounds === 'undefined') {
		g_map = L.map('map', {
				zoomControl: false,
				attributionControl: false
			})
			.addLayer(tilelayer)
			//.setView([50.9384, 6.9604], 15)
			.setView(centerPoint, 3)
			;
	} else {
		g_map = L.map('map', {
				zoomControl: false,
				attributionControl: false
			})
			.addLayer(tilelayer)
			.setView(centerPoint, 3)
			//.fitBounds(bounds)
			;
	}
		
    //.setView([52.3610, -71.0587], 2);	
	new L.Control.Attribution({position: 'bottomright'}).addTo(g_map);
	//new L.Control.Zoom({ position: 'bottomright' }).addTo(g_map);
	new L.Control.Zoom({ position: 'topleft' }).addTo(g_map);
	
//	var southWest = L.latLng(40.712, -74.227);
//    var northEast = L.latLng(40.774, -74.125);
//	var mapBounds = L.latLngBounds(southWest, northEast);
//	g_map.setMaxBounds(mapBounds);
	

	g_map.options.minZoom = 3;
	g_map.options.maxZoom = 14;
	//g_map.on('mousemove click', function(e) {
	//});

	g_map.on('click', function (e) {
		divpcontent_hide();
	});

	
	if (typeof leaflet_ready === 'function') { 
		leaflet_ready(); 
	}

};
// ---------------------------------
// funder_ids: array (if empty array then show all)
var show_pins = function(funder_ids, status) {
	g_status = status;
	if (undefined === funder_ids) funder_ids = [];
	remove_all_pins();
	var url = 'ajax/map/get-funder-receiver-countries';
	var cy_index = $('#countrieslist').val();
        var cy = g_markerlist[cy_index];
	var cy_id = null;
	if (cy_index != -1) {
		if (cy != null && cy.cy_id) {
			cy_id = cy.cy_id;
		}
	}
	else {
		cy_id = -1;
	}
	var data = {
		'funder_ids': funder_ids,
		'vgs': g_vgs,
		'status': status,
		'cy_id': cy_id
	};
	aj_post(url,data,function(d) {
		//infopopup('Daten da');
		var pc, previousCyId;
		// draw pins
		g_markerlist = d.list;
		for(var i = 0; i < d.list.length; i++) {
			if (d.list[i].cy_id) {
				draw_divicon(i);
			}
		}
		// set partner countries
		var html = '';
		var firstletter = '';
		var nextletter = '';
		var info = '';
		$('#countrieslist').empty();
		$('#countrieslist').append('<option value=""></option>');
		$('#countrieslist').append('<option value="-1">Global Scope</option>');
		for(var i = 0; i < d.list.length; i++) {
			var pc = d.list[i];
			if (pc.cy_id != null) {
				info += pc.cy_id + ',';
				nextletter = pc.cy_name.substr(0,1);
				$('#countrieslist').append('<option value="'+i+'">'+g_htmlspecialchars(pc.cy_name)+' ('+pc.n+')'+'</option>');
			}
		}
		if (cy_id != null) {
			$('#countrieslist').val(cy_index);
		}
		$('#countrieslist').trigger('chosen:updated');
		$('#countrieslist').on('change', function (evt, params) {
			if ($(this).val() != '') {
				if ($(this).val() != -1) {
					country_click($(this).val());
				}
				update_pins();
			}
			else {
				popup_close();
				if (previousCyId == -1) {
					update_pins();
				}
			}
			previousCyId = $(this).val();
		});
		$('#idcountercountries').html(d.list.length);
		g_funder_ids = d.funder_ids;
		
		// n_prog
		status = parseInt(status);
		var html = '';
		if (2 === status) {
			html = d.n_prog+' active programmes';
		} else if (3 === status) {
			html = d.n_prog+' completed programmes';
		} else {
			html = d.n_prog+' programmes';
		}
		$('#id_n_prog').html(html);
	});
};

// ---------------------------------
// size 1 small 2 middle 3 large
var draw_divicon = function(idx_markerlist) {
	var size;

	var d = g_markerlist[idx_markerlist];
	var lat = d.cy_lat;
	var lng = d.cy_lng;
	var name = d.cy_name;
	var n = d.n;
	n = parseInt(n);
	if (n < 7) {
		size = 1;
	} else 	if (n < 15) {
		size = 2;
	} else {
		size = 3;
	}
	var classextra = '';
	switch(g_status) {
		case 3: classextra = ' program-div-icon_status_3'; break;
		case 2: classextra = ' program-div-icon_status_2'; break;
		case 1: classextra = ' program-div-icon_status_' + g_status + '-' + size; break;
//		case 1: classextra = ' program-div-icon_status_' + g_status + '-2'; 
//			console.log(classextra);
//			break;
	}
	var classextra = ' program-div-icon_status_' + g_status + '-' + size;

	switch(size) {
		case 3:
			var className = 'program-div-icon3' + classextra;
			var iconSize = L.point(42,51);
			var iconAnchor = L.point(21,51);
			break;
		case 2:
			var className = 'program-div-icon2' + classextra;
			var iconSize = L.point(32,39);
			var iconAnchor = L.point(16,39);
			break;
		case 1:
			var className = 'program-div-icon1' + classextra;
			var iconSize = L.point(22,27);
			var iconAnchor = L.point(11,27);
			break;
		default:
			console.log('ERROR: divicon size');
	}
	//var myIcon = L.divIcon({className: 'my-div-icon'});
	//L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
	//var myIcon = L.divIcon();
	var myIcon = L.divIcon(
		{
			className: className,
			iconSize: iconSize,
			iconAnchor: iconAnchor,
			html: n
		}
	);
	// Tooltip:  title: name
	//var marker =  L.marker([parseInt(lat),parseInt(lng)], {icon: myIcon,title: name}).addTo(g_map);
	var marker =  L.marker([parseFloat(lat),parseFloat(lng)],
		{
			icon: myIcon,
			//title: name,
			title: name,
			idx_markerlist:idx_markerlist
		}
		).addTo(g_map);
	marker.addTo(g_map);
	g_markers.push(marker);
	
	marker.on('click',marker_click);
};
// ---------------------------------
var marker_click = function(e) {
	popup_show(e.target.options.idx_markerlist);
	//var latlong = e.target.getLatLng();
};
// ---------------------------------
var popup_show = function(idx_markerlist) {
	var d = g_markerlist[idx_markerlist];
	var lat = d.cy_lat;
	var lng = d.cy_lng;
	
	var url = 'ajax/map/get-country-popup-data';
	var data = {
		'funder_ids': g_funder_ids,
		'status': g_status,
		'cy_id': d.cy_id
	};
	aj_post(url,data,function(d) {
		if (!g_popup) {
			var myIcon = L.divIcon(
				{
					className: 'countrypopup',
					iconSize: L.point(250,197),
					iconAnchor: L.point(125,207),
					html: get_marker_html(idx_markerlist,d.data)
				}
			);
			var marker =  L.marker([lat,lng], {icon: myIcon,title: ''}).addTo(g_map);
			marker.setZIndexOffset(1000);
			g_popup = marker;
			// clicks inside the popup must not reach the map (its click handler hides #pcontent)
			L.DomEvent.disableClickPropagation(marker._icon);
			//marker.on('click',popup_click);
			//console.log('Popup');console.log(marker);
		} else {
			var myIcon = g_popup.options.icon;
			myIcon.options.html = get_marker_html(idx_markerlist,d.data);
			var newpos = [lat,lng];
			g_popup.setLatLng(newpos);
			g_popup.setIcon(myIcon);
			L.DomEvent.disableClickPropagation(g_popup._icon); // setIcon creates a new element
		}
	});
	
	
	//marker.bringToFront();
	//marker.setZIndex(10000);
};
// ---------------------------------
var popup_click = function(e) {
	//popup_close();
};
// ---------------------------------
var popup_close = function() {
	if (!g_popup) return;
	g_map.removeLayer(g_popup);
	g_popup = null;
};
// ---------------------------------
var popup_close_with_delay = function() {
	setTimeout(function(){ popup_close(); }, 200);
};
// ---------------------------------
var my_fund_format = function(fund) {
	fund.toFixed(1);
}

// ************
// FROM: http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
var my_formatMoney = function(v,decPlaces, thouSeparator, decSeparator) {
    var n = v,
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
        decSeparator = decSeparator == undefined ? "." : decSeparator,
        thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
};
// ---------------------------------
var get_marker_html = function(idx_markerlist,data) {
	var d = g_markerlist[idx_markerlist];
	var lat = d.cy_lat;
	var lng = d.cy_lng;
	var name = d.cy_name;
	var n = parseInt(d.n);
	
	var n_prog = n + ' programmes';
	if (1 === n) n_prog = '1 programme';
	
	var s = 
		'<div class="countrypopup-head" onclick="popup_close_with_delay();return false;" title="Click to close popup">' + name + '</div>'
		+ '<div class="countrypopup-content">'
+ '<table class="table-popup">'
+ ' <tr>'
+ '  <th colspan="2">Programmes<br/>by your selection</th>'
+ '  <th colspan="2" style="text-align:right">Funds [USD]</th>'
+ ' </tr>'
;
if (2 === g_status) {
	s += ' <tr class="selected">';
} else {
	s += ' <tr>';
}
s += '  <td width="15" class="isnumber">' + data.n2 + '</td>'
+ '  <td width="100">Active</td>'
+ '  <td width="65" class="isnumber">' + my_formatMoney(data.funds2,1,',','.') + '</td>'
+ '  <td width="20">mio</td>'
+ ' </tr>'
if (3 === g_status) {
	s += ' <tr class="selected">';
} else {
	s += ' <tr>';
}
s += '  <td class="isnumber">' + data.n3 + '</td>'
+ '  <td>Completed</td>'
+ '  <td class="isnumber">' + my_formatMoney(data.funds3,1,',','.') + '</td>'
+ '  <td>mio</td>'
+ ' </tr>'
if (1 === g_status) {
	s += ' <tr class="sum selected">';
} else {
	s += ' <tr class="sum">';
}
s += '  <td class="isnumber">' + data.n1 + '</td>'
+ '  <td>Total</td>'
+ '  <td class="isnumber">' + my_formatMoney(data.funds1,1,',','.') + '</td>'
+ '  <td>mio</td>'
+ ' </tr>'
+ '</table>'
+ '<a href="#" onclick="popup_more_click('+idx_markerlist+');return false;">More <img width="12" height="7" src="assets/images/svg/bottom-arrow-orange.svg" alt=""></a>';
		


//		+ '<div class="div1">'
//		+ '<span onclick="popup_close()" class="pcount">' + n_prog + '</span> by your selection<br/>'
//		+ 'XX active'
//		+ '</div>'
//		+ '<div class="div2">'
//		+ '<span class="line1">USD XX million active funds</span><br/>'
//		+ '<span class="line2">USD XX million total funds</span><br/>'
//		+ '</div>'
//		+ '<div class="div3">'
//		+ '<a href="#" onclick="popup_more_click('+idx_markerlist+');return false;">More</a>';
////		+ '111';
//		+ '</div>'
		
		+ '</div>'
		;
	return s;
};
// ---------------------------------
var funder_click = function(funder_id) {
	//infopopup('Funder click '+funder_id);
	var $funder = $('#f'+funder_id);
	if ($funder.hasClass('buttonselected')) {
		$funder.removeClass('buttonselected');
	} else {
		$funder.addClass('buttonselected');
	}
	$('#fall').removeClass('buttonselected');
	update_pins();
};
// ---------------------------------
var country_click = function(idx_markerlist) {
	var d = g_markerlist[idx_markerlist];
	var lat = d.cy_lat;
	var lng = d.cy_lng;
	var name = d.cy_name;
	var n = d.n;
	g_map.panTo([lat,lng]);
	
	var x = $(window).width() - ($('#mapcontent').offset().left + $('#mapcontent').width());
	
	
	popup_show(idx_markerlist);
	//infopopup('... under construction ... '+idx_markerlist);
};
// ---------------------------------
var popup_more_click = function(idx_markerlist) {
	var d = g_markerlist[idx_markerlist];
	
	show_programmes(d.cy_id);
//	infopopup('... under construction ... '+idx_markerlist);
	
};
// ---------------------------------
var select_all_funders = function() {
	$('#funderlist > a').removeClass('buttonselected');
	var n = $('#funderlist > a').length;
	$('#idcounterdonors').html('('+n+' selected)');
	$('#fall').addClass('buttonselected');
	update_pins();
};
// ---------------------------------
var update_pins = function() {
	popup_close();

	
	// status
	var status = 1;
	if ($('#s1').hasClass('buttonselected')) {
		status = 1;
	} else if ($('#s2').hasClass('buttonselected')) {
		status = 2;
	} else if ($('#s3').hasClass('buttonselected')) {
		status = 3;
	}
	if ($('#fall').hasClass('buttonselected')) {
		show_pins([],status);
	} else {
		var ids = [];
		//infopopup('Update pins selection');
		var funder_counter = 0;
		$('#funderlist > a.buttonselected').each(function(idx,element) {
			ids.push($(this).data('id'));
			funder_counter++;
		});
		$('#idcounterdonors').html('('+funder_counter+' selected)');

		if (0 === ids.length) {
			$('#idcountercountries').html('');
			$('#countrieslist').html('');
			remove_all_pins(); // show nothing
		} else {
			show_pins(ids,status);
		}
	}
};
// ---------------------------------
var remove_all_pins = function() {
	for(var idx in g_markers) {
		g_map.removeLayer(g_markers[idx]);
	}
//	for(var i=0;i < g_markers.length;i++) {
//		console.log('inside loop '+i);
//		g_map.removeLayer(g_markers[i]);
//	}
	g_markers = [];
};
// ---------------------------------
var reset_search = function() {
	// Countries list
	$('#countrieslist').val('');
	// Donors
	$('#funderlist > a').removeClass('buttonselected');
	var n = $('#funderlist > a').length;
        $('#idcounterdonors').html('('+n+' selected)');
        $('#fall').addClass('buttonselected');
	// Status
	$('#s1').addClass('buttonselected');
        $('#s2').removeClass('buttonselected');
        $('#s3').removeClass('buttonselected');
	// VGs
	$('ul#vgs > li').each(function() {
		$(this).removeClass('selected').data('selected','0');
	});
	$('ul#vgs > li > ul > li').each(function() {
		$(this).removeClass('selected').data('selected','0');
        });
  	get_selected_vgs();
};

var change_status = function(statusid) {
	switch(statusid) {
		case 1:
			$('#s1').addClass('buttonselected');
			$('#s2').removeClass('buttonselected');
			$('#s3').removeClass('buttonselected');
			break;
		case 2:
			$('#s1').removeClass('buttonselected');
			$('#s2').addClass('buttonselected');
			$('#s3').removeClass('buttonselected');
			break;
		case 3:
			$('#s1').removeClass('buttonselected');
			$('#s2').removeClass('buttonselected');
			$('#s3').addClass('buttonselected');
			break;
	}
	update_pins();
};
// ---------------------------------
var setlayer = function(id) {
	var newlayer = g_tilelayer1;
	if (1 === id) {
		newlayer = g_tilelayer1;
		$('#butterrain').addClass('buttonselected');
		$('#butsat').removeClass('buttonselected');
	}
	if (2 === id) {
		newlayer = g_tilelayer2;
		$('#butterrain').removeClass('buttonselected');
		$('#butsat').addClass('buttonselected');
	} else if (0 === id) {
		newlayer = g_tilelayer0;
		$('#butterrain').removeClass('buttonselected');
		$('#butsat').removeClass('buttonselected');
	}
	
	if (g_currentlayer === newlayer) return;
	
	g_map.removeLayer(g_currentlayer);
	g_map.addLayer(newlayer);
	g_currentlayer = newlayer;
};
// ---------------------------------
var divpcontent_hide = function(statusid) {
	$('#pcontent').hide();
};
// ---------------------------------
var show_programmes = function(cy_id) {
	if (undefined === cy_id) cy_id = 0;
	if (cy_id === 0) {
		// Check if there isn't a country selected
		var cy_index = $('#countrieslist').val();
		if (cy_index != -1) {
	        	var cy = g_markerlist[cy_index];
	        	if (cy != null && cy.cy_id) {
	                	cy_id = cy.cy_id;
			}
		}
		else {
			cy_id = -1;
		}
	}
	var url = 'ajax/map/get-programs-details';
	var data = {
		'funder_ids': g_funder_ids,
		'status': g_status,
		'vgs': g_vgs,
		'cy_id': cy_id
	};
	aj_post(url,data,function(d) {
		
		if (d.n_prog) {
			//infopopup('Programmes: '+d.n_prog);
			$('#ulprogrammes').html(d.html);
			var s = '';
			var textstatus = '';
			if (2 === g_status) textstatus = 'active ';
			if (3 === g_status) textstatus = 'completed ';
			if (1 == d.n_prog) {
				s = '1 ' + textstatus + 'programme';
			} else {
				s = d.n_prog + ' ' + textstatus + ' programmes';
			}
			if (d.countryname) {
				s += ' in ' + g_htmlspecialchars(d.countryname);
			}
			$('#idprogcounttext').html(s);
			$('#pcontent').scrollTop();
			$('#pcontent').show();
			// n_active
			if (g_status != 2 && g_status != 3) {
				d.n_completed = d.n_prog - d.n_active;
                		$('#id_n_active').html(d.n_active + ' active, ' + d.n_completed + ' completed' );
			}
			else {
				$('#id_n_active').html('');
			}
			var active_funds = d.active_funds * 1000000;
			var total_funds = d.total_funds * 1000000;
			if (g_status == 2) {
				$('#id_active_funds').html('Active programmes: USD ' + active_funds.toLocaleString('en-US'));
				$('#id_total_funds').html('');
			}
			else if (g_status == 3) {
				$('#id_active_funds').html('Completed programmes: USD ' + total_funds.toLocaleString('en-US'));
                                $('#id_total_funds').html('');
			}
			else {
				var completed_funds = total_funds - active_funds;
				$('#id_active_funds').html('Active programmes: USD ' + active_funds.toLocaleString('en-US') + '; ');
                                $('#id_total_funds').html('completed programmes: USD ' + completed_funds.toLocaleString('en-US') + '; all programmes: USD ' + total_funds.toLocaleString('en-US'));
			}
			var h = $('#pcontent .divtitle').outerHeight();
			//console.log('h: '+h);
			h += 5;
			$('#ulprogrammes').css('top', h+'px');
//			$('#ulprogrammes').css('top', '10px');
			$('#ulprogrammes').scrollTop();
			
		}

		if (isLoading) {
//			var hash = window.location.hash.substring(1);
//			location.href = '#' + hash;
			isLoading = false;
		}
	});




};

var print_programmes = function() {
	var url = 'export?print=1&funder_ids=' + g_funder_ids + '&status=' + g_status + '&vgs=' + g_vgs;
	window.open(url);
};

var export_programmes = function() {
	var url = 'export?funder_ids=' + g_funder_ids + '&status=' + g_status + '&vgs=' + g_vgs;
	window.open(url);
};

// ---------------------------------
// Show/hide filter donors, countries, VG
var showfilters = function() {
	var $e = $('#idshowfilters > img');
	var $d = $('#idfilterdonors');
	var $c = $('#idfiltercountries');
	var $vg = $('#idfiltervg');
	
//	$d.slideUp('slow');
//	$d.hide();
//	return;
	

	if ('open' === $e.data('status')) {
		$e.removeClass('open').data('status','closed');
		console.log('in close');

		$d.slideUp('slow');
		$c.slideUp('slow');
		$vg.slideUp('slow');
	} else {
		console.log('in open');
		$e.addClass('open').data('status','open');;
		
		$d.slideDown('slow');
		$c.slideDown('slow');
		$vg.slideDown('slow');
	}
};
// ---------------------------------


