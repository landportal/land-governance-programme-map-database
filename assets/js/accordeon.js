// -------------------------------------------------
// jquery accordeon plugin with royalslider
// version: 2015-11-12
// version: 2016-04-18 Extra css  li-class for open close
// -------------------------------------------------
// -------------------------------------------------


// -------------------------------------------------
// Anleitung:
// - Es kann ein Slider pro accordeon-content-area angelegt werden.
// - Jeder Slider-ID darf nur einmal vorkommen.
// - Jeder Slider wird automatisch initialisiert, einfach nur html eintragen, fertig.
// - Alle Slider haben die gleichen Einstellungen, zu finden in der Variable "common_royalslider_settings"
// - Die Hashtags stehen im li-Element als id="hash-wert". Es dürfen keine Leerzeichen enthalten sein.
// - Spätes Laden von Bilder:
//   - Pro Gallery muss mindestens ein Bild im DIV-Bereich stehen
//   - Alle weiteren Bilder können optiona in ein data-Array geschrieben werden, so dass die dortigen Bilder 
//     erst beim ersten Aufklappen geladen werden. So lässt sich der Slider so optimieren, dass beim Seitenaufruf
//     immer nur ein Bild pro Slider geladen wird.
//   - Namenskonventionen: Heißt eine Gallery ID z.B. gallery_3 dann einfach ein javascript-Bilder-Array anlegen mit Namen gallery_3_data.
//   - In diesem Array stehen die gleichen Bilder wie sie auch im Slider stehen, mit genau der gleichen Notation.
// -------------------------------------------------




// id,false,-1
$.accordeon = function(id_accrodion,common_royalslider_settings,close_previous_element,startup_open_element_no) {

	var $g_open_content_element = null;
	var g_close_previous_element = (undefined === close_previous_element)?false:close_previous_element;
	startup_open_element_no = (undefined === startup_open_element_no)?-1:startup_open_element_no;
	init_open_accordeon(startup_open_element_no); // 0:first li, 1:second list, -1: do not open any list
	$('#'+id_accrodion+' > li > .accordeon-title-area').each(function(index) {
		$(this).data('index',index).data('status','closed'); // open/closed
		var $content = $(this).parent().children('.accordeon-content-area');
		$content.data('index',index);
	});
	$('#'+id_accrodion+' > li > .accordeon-title-area').click(function() {
		accordeon_openclose($(this));
	});
	function accordeon_openclose($element) {
		var $content = $element.parent().children('.accordeon-content-area');
		if (g_close_previous_element) {
			if (null !== $g_open_content_element && !$content.is($g_open_content_element)) {
				$g_open_content_element.slideUp('slow').data('status','closed');
				$g_open_content_element.parent().children('.accordeon-title-area').children('.openicon').removeClass('open');
				$g_open_content_element.parent().removeClass('liopen');
			}
		}
		if ('open' === $content.data('status')) {
			$content.slideUp('slow').data('status','closed');
			$content.parent().children('.accordeon-title-area').children('.openicon').removeClass('open');
			$content.parent().removeClass('liopen');
		} else {
			$g_open_content_element = $content;
			$content.slideDown('slow').data('status','open');
			$content.parent().children('.accordeon-title-area').children('.openicon').addClass('open');
			$content.parent().addClass('liopen');
			init_slider($content);
			//parent.location.hash = encodeURIComponent($content.parent().attr('id'));
			var stateObj = { };
			//window.history.pushState(stateObj, "the works", "the-works.htm#"+encodeURIComponent($content.parent().attr('id')));

		}
	}
	function accordeon_startup(show_index) {
		$('#'+id_accrodion+' > li > .accordeon-title-area').each(function(index) {
			if (index === show_index) {
				var $content = $(this).parent().children('.accordeon-content-area');
				$g_open_content_element = $content;
				$content.show().data('status','open');
				$content.parent().children('.accordeon-title-area').children('.openicon').addClass('open');
				$content.parent().addClass('liopen');
				init_slider($content);
			}
		});
	}
	function init_slider($content) {
		if ('done' === $content.data('contentinit')) return;
		$content.data('contentinit','done');
		var slider_id = $content.find('div.slider > div').attr('id');
		if ("undefined" !== typeof(slider_id)) {
			var settings = JSON.parse(JSON.stringify(common_royalslider_settings));
			// load images just in time they are needed
			var data_id = slider_id+'_data';
			var data = window[data_id];
			var theslides = data.join('');
			settings.slides = theslides;

			var slider = $('#'+slider_id).royalSlider(settings).data('royalSlider');
		}
	}
	function accordeon_startup_with_content($content) {
		$g_open_content_element = $content;
		$content.show().data('status','open');
		$content.parent().children('.accordeon-title-area').children('.openicon').addClass('open');
		$content.parent().addClass('liopen');
		init_slider($content);
		//parent.location.hash = encodeURIComponent($content.parent().attr('id'));
		$g_open_content_element = $content;
	}
	function init_open_accordeon(startup_index) {
		var found = false;
		//var selected_hash = parent.location.hash;
		var selected_hash = '';
		//var selected_hash = $.urlParam('goto');
		$('#'+id_accrodion).children('li').each(function() {
			var li_hash = $(this).attr('id');
			if (selected_hash === ('#'+li_hash)) {
				var $content = $(this).children('.accordeon-content-area');
				accordeon_startup_with_content($content);
				found = true;
				$('body, html').scrollTop($(selected_hash).offset().top);
				return;
			}
		});
		if (!found) {
			accordeon_startup(startup_index);
		}
	}
}
