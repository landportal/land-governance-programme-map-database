/* In-browser replacement for the /ajax/map/* endpoints of landgov.donorplatform.org.
 * Answers the three requests from assets/data/data.json (snapshot of the site data).
 * Rules (verified against the cached answers of the original site):
 *  - a programme counts in full (not split) in each of its partner countries
 *  - several donors combine as OR; several VGGT chapters also as OR (unverified)
 *  - popup totals ignore the chapter filter and follow the status filter
 *  - funds are in millions of USD; programmes without a value add 0 funds
 */
(function (root) {
	'use strict';
	var D = null, byCountry = {}, names = {}, noCountry = [], waiting = [];

	function init(d) {
		D = d;
		byCountry = {}; names = {}; noCountry = [];
		d.countries.forEach(function (c) { names[c[0]] = c[1]; });
		d.programmes.forEach(function (p) {
			if (!p.c.length) noCountry.push(p);
			p.c.forEach(function (c) { (byCountry[c] = byCountry[c] || []).push(p); });
		});
		var w = waiting; waiting = [];
		w.forEach(function (f) { f(); });
	}
	function load(url) {
		var x = new XMLHttpRequest();
		x.open('GET', url);
		x.onload = function () { init(JSON.parse(x.responseText)); };
		x.onerror = function () { console.error('Could not load ' + url); };
		x.send();
	}
	function whenReady(f) { if (D) f(); else waiting.push(f); }

	function ids(x) {
		if (x === undefined || x === null || x === '') return [];
		if (!Array.isArray(x)) x = [x];
		return x.map(Number).filter(function (n) { return !isNaN(n); });
	}
	function inter(a, b) { for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) >= 0) return true; return false; }
	function pick(list, f, v, status) {
		return list.filter(function (p) {
			if (f.length && !inter(p.d, f)) return false;
			if (v && v.length && !inter(p.g, v)) return false;
			if (status === 2 && !p.a) return false;
			if (status === 3 && p.a) return false;
			return true;
		});
	}
	function sum(list) { var s = 0; list.forEach(function (p) { s += p.v; }); return s; }
	function head() { return { ok: true, errors: [], userloggedin: false }; }
	function cyArg(x) { return (x === undefined || x === null || x === '') ? null : Number(x); }

	function pins(q) {
		var f = ids(q.funder_ids), v = ids(q.vgs), st = Number(q.status) || 1, cy = cyArg(q.cy_id);
		var list = [];
		D.countries.forEach(function (c) {
			var n = pick(byCountry[c[0]] || [], f, v, st).length;
			if (n) list.push({ cy_id: String(c[0]), n: String(n), cy_name: c[1], cy_lng: c[2], cy_lat: c[3] });
		});
		var n_prog;
		if (cy === null || cy === 0) n_prog = pick(D.programmes, f, v, st).length;
		else if (cy === -1) n_prog = pick(noCountry, f, v, st).length;
		else n_prog = pick(byCountry[cy] || [], f, v, st).length;
		var r = head(); r.funder_ids = f; r.list = list; r.n_prog = String(n_prog); r.vgs = v;
		return r;
	}
	function popup(q) {
		var f = ids(q.funder_ids), st = Number(q.status) || 1, cy = Number(q.cy_id);
		var S = pick(byCountry[cy] || [], f, null, st);   // chapter filter does not apply to popups
		var act = S.filter(function (p) { return p.a; }), comp = S.filter(function (p) { return !p.a; });
		var r = head(); r.funder_ids = f; r.cy_id = cy;
		r.data = { funds2: sum(act), n2: act.length, funds3: sum(comp), n3: comp.length, n1: S.length, funds1: sum(S) };
		return r;
	}
	function programmes(q) {
		var f = ids(q.funder_ids), v = ids(q.vgs), st = Number(q.status) || 1, cy = cyArg(q.cy_id);
		var base = cy === null || cy === 0 ? D.programmes : cy === -1 ? noCountry : (byCountry[cy] || []);
		var S = pick(base, f, v, st);
		var act = S.filter(function (p) { return p.a; });
		var r = head(); r.funder_ids = f; r.cy_id = cy === null ? 0 : cy;
		r.html = S.map(function (p) { return p.h; }).join('');
		r.n_prog = S.length; r.countryname = (cy > 0 && names[cy]) || '';
		r.active_funds = sum(act); r.total_funds = sum(S); r.n_active = act.length;
		return r;
	}
	function query(url, q) {
		var ep = String(url).split('/').pop();
		if (ep === 'get-funder-receiver-countries') return pins(q || {});
		if (ep === 'get-country-popup-data') return popup(q || {});
		if (ep === 'get-programs-details') return programmes(q || {});
		throw new Error('Unknown endpoint: ' + ep);
	}
	root.LG = { init: init, load: load, whenReady: whenReady, query: query };
	if (typeof module !== 'undefined') module.exports = root.LG;
})(typeof window !== 'undefined' ? window : globalThis);
