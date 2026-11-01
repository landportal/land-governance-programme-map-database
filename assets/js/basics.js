// Version 2016-02-17 adm_post_form extended
// Version 2016-05-02

"use strict";

function g_ajaxchecklogin(data) {
	if (typeof data.userloggedin === 'undefined') {
		console.log('Error: data object corrupt');
		return false;
	}
	if (true !== data.userloggedin ) {
		window.location = 'admin/login';
		return false; // will be ignored because of loading new page
	}
	return true;
}

function g_htmlspecialchars(str) {
	return str
		.replace('&', '&amp;')
		.replace('"', '&quot;')
		.replace("'", '&#039;')
		.replace('<', '&lt;')
		.replace('>', '&gt;')
		;
}

var g_infopopup_created = false;
// messagetype: wait error (nothing)
var infodialog = function (id, elt, my, at) {
	if (!my) {
		my = "right top";
	}
	if (!at) {
		at = "right bottom";
	}
	$('#'+id).dialog({
		modal: true,
		width: '500px',
		position: { my: my, at: at, of: elt }
	});
};

var infopopup = function(text,messagetype,newshowduration) {
	// messagetype: error or nothing
	if (!g_infopopup_created) {
		var e = $('<div id="infopopup"></div>');
		$('body').append(e);
		g_infopopup_created = true;
	}
	$("#infopopup").removeClass();
	if (messagetype) {
		$("#infopopup").addClass(messagetype);
	}
	$("#infopopup").html(text);
	$("#infopopup").css({
		left: ($(window).width() - $("#infopopup").outerWidth())/2
	});//	
//	$("#infopopup").stop(true,false).fadeIn(200).animate({"null":1},4000).fadeOut(1000);
//	$("#infopopup").stop(true,false).fadeIn(200).animate({"null":1},3000).fadeOut(1000);
//	$("#infopopup").stop(true,false).fadeIn(200);
	var h = $("#infopopup").outerHeight();
//	$("#infopopup").css({ top: '-'+h+'px' });
//	$("#infopopup").stop(true,false).animate({top:0}).animate({"null":1},4000).animate({top:-h});

//	$("#infopopup").stop(true,false).show().animate({top:0}).animate({"null":1},4000).animate({top:-h},{duration:1000,complete: function() {$("#infopopup").hide();}});
	var showduration = 4000;
	if (undefined !== newshowduration) {
		showduration = newshowduration;
	}

	$("#infopopup").css({ opacity: 1 });
	//$("#infopopup").stop(true,false).show().animate({top:0}); return; // for debugging colors etc.
	$("#infopopup").stop(true,false).show().animate({top:0}).animate({"null":1},showduration).fadeOut(1000,
	function() {
		$("#infopopup").hide();
		$("#infopopup").css({ top: '-'+h+'px' });
	});
	
	//$("#infopopup").stop(true,false).fadeIn(200).animate({"null":1},2000);
//	$("#infopopup").stop(true,false).show(0).animate({"null":1},2000).fadeOut(1000);
};

// ************
$(document).ready(function() {
//	$('input[type="radio"],input[type="checkbox"]').focus( function() {
//		$(this).parent().addClass('active');
//	});
//	$('input[type="radio"],input[type="checkbox"]').focusout( function() {
//		$(this).parent().removeClass('active');
//	});
	
	if (typeof g_popup_errormessage !== 'undefined' && g_popup_errormessage.length) {
		infopopup(g_popup_errormessage,'error');
	} else if (typeof g_popup_message !== 'undefined' && g_popup_message.length) {
		infopopup(g_popup_message);
	}

	$('.vggt-accordion').accordion({
		header: "h3",
		icons: false,
		active: false,
		collapsible: true,
		activate: function (evt, ui) {
			$(ui.newHeader).find('img').addClass('open');
			$(ui.oldHeader).find('img').removeClass('open');
		}
	});
	
});
// ************
// token will be  automatically included, no token inside form necessary
function aj_post_form(url,idform,function_success,function_error) {
	//console.log('aj_post_form :: idform: '+idform);
	var form_data = $("#"+idform+" :input").serializeArray();
	var data = {};
	for(var idx = 0; idx < form_data.length; idx++) {
		data[form_data[idx].name] = form_data[idx].value;
		//console.log(form_data[idx].name);
	}
//	$("#"+idform+" textarea").each(function() {
//		console.log('FOUND TEXTAREA');
//		console.log('Name: '+this.name);
//		console.log('id: '+this.id);
//		console.log('Val: '+$('#'+this.id).val());
//		data[this.name] = $('#'+this.id).val();
//	});
//	var form_data = $("#"+idform+" textarea").serializeArray();
//	for(var idx = 0; idx < form_data.length; idx++) {
//		console.log('aj_post_form :: textarea name: '+form_data[idx].name);
////		console.log('aj_post_form :: textarea html: '+form_data[idx]);
//		console.log(form_data[idx]);
//		data[form_data[idx].name] = form_data[idx].html;
//		//console.log(form_data[idx].name);
//	}
// $('#id-textarea-246926').value
// $('#id-textarea-246926').value
// $('#id-textarea-246926').val()

	//console.log('data:');
	//console.log(data);
	aj_post(url,data,function_success,function_error);
}
// ************
// token will be  automatically included
function aj_post(url,data,function_success,function_error) {
	// Static version (GitHub Pages): no server. The answer is computed in the browser
	// from assets/data/data.json by assets/js/engine.js (same response format as the original site).
	LG.whenReady(function() {
		var d;
		try {
			d = LG.query(url, data);
			function_success(d);
		} catch(err) {
			console.log(err);
			infopopup('Error: '+err.message,'error');
			if (function_error) function_error();
		}
	});
}
// ************
// FROM: http://stackoverflow.com/questions/332872/encode-url-in-javascript
function my_urlencode(str) {
  str = (str + '')
    .toString();

  // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
  // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .
  replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/%20/g, '+');
}
// ************
// FROM: http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
Number.prototype.my_formatMoney = function(decPlaces, thouSeparator, decSeparator) {
    var n = this,
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
        decSeparator = decSeparator == undefined ? "." : decSeparator,
        thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
};
// ************
