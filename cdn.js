// The script prepares CDN files directly from GitHub's actions

const Fs = require('fs');
require('total4');

FUNC.indent = function(count, val) {

	var lines = val.split('\n');
	var str = '';
	var total = Math.abs(count);
	var is = false;

	for (var i = 0; i < total; i++)
		str += '\t';

	for (var i = 0; i < lines.length; i++) {
		if (count > 0 && lines[i])
			lines[i] = str + lines[i];
		else if (lines[i].substring(0, total) === str) {
			lines[i] = lines[i].substring(total);
			is = true;
		} else if (lines[i] && !is)
			break;
	}

	return lines.join('\n');
};

FUNC.evaluate = function(code) {
	var obj = {};
	new Function('exports', code)(obj);
	return obj;
};

FUNC.parse = function(filename, response) {

	var version = response.match(/exports\.version.*?;/);
	var author = response.match(/exports\.author.*?;/);
	var color = response.match(/exports\.color.*?;/);
	var icon = response.match(/exports\.icon.*?;/);
	var name = response.match(/exports\.name.*?;/);
	var group = response.match(/exports\.group.*?;/);
	var data = {};

	data.id = filename;
	data.group = group ? FUNC.evaluate(group[0]).group : '';
	data.name = name ? FUNC.evaluate(name[0]).name : '';
	data.author = author ? FUNC.evaluate(author[0]).author : '';
	data.icon = icon ? FUNC.evaluate(icon[0]).icon : '';
	data.color = color ? FUNC.evaluate(color[0]).color : undefined;
	data.version = version ? FUNC.evaluate(version[0]).version : '';
	data.url = 'https://cdn.componentator.com/uibuilder/' + filename + '-v' + (data.version || '1') + '/editor.html';

	var index = response.indexOf('<readme>');

	if (index !== -1)
		data.readme = FUNC.indent(-1, response.substring(index + 8, response.indexOf('</readme>', index + 8))).trim();

	return data;
};

var path = F.path.join(process.cwd(), '/components/');

Fs.readdir(path, function(err, dir) {

	var cdn = F.path.join(process.cwd(), '/cdn/');

	try {
		Fs.mkdirSync(cdn);
	} catch(e) {}

	dir.wait(function(item, next) {

		// var builder = [];

		var dircomponent = F.Path.join(path, item);
		var files = ['editor.html', 'render.html', 'settings.html'];
		var p;

		files.wait(function(file, next) {

			if (file === 'editor.html') {
				var html = F.Fs.readFileSync(F.Path.join(dircomponent, file)).toString('utf8');
				var data = FUNC.parse(item, html);

				p = F.Path.join(cdn, item + '-v' + (data.version || 1));

				try {
					F.Fs.mkdirSync(p);
				} catch (e) {}

				var reg = new RegExp('/components/' + item + '/', 'g');
				F.Fs.writeFile(F.Path.join(p, file), html.replace(reg, 'https://cdn.componentator.com/uibuilder/' + item + '-v' + (data.version || 1) + '/'), next);
			} else
				F.Fs.copyFile(F.Path.join(dircomponent, file), F.Path.join(p, file), next);

		}, next);

	}, () => console.log('Done.'));
});