var ArrayList = function () {
	this.data = [];
	this.len = 0;
};

ArrayList.prototype.add = function(elem) {
	this.data.push(elem);
	this.len++;
};

ArrayList.prototype.remove = function(elem) {
	var pos = this.data.indexOf(elem);
	if (pos != -1) {
		this.data.splice(pos, 1);
		this.len--;
	}
};

ArrayList.prototype.get = function(i) {
	if (i < this.size() && i >= 0) {
		return this.data[i];
	} else {
		return -1;
	}
};

ArrayList.prototype.size = function() {
	return this.len;
};

ArrayList.prototype.print = function() {
	return this.data.toString();
};

exports.ArrayList = ArrayList;


