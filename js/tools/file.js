// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, fs, icons, kerror, klog, ref, slash, valid;

ref = require('kxk'), slash = ref.slash, valid = ref.valid, klog = ref.klog, fs = ref.fs, kerror = ref.kerror;

icons = require('./icons.json');

File = (function() {
    function File() {}

    File.isImage = function(file) {
        var ref1;
        return (ref1 = slash.ext(file)) === 'gif' || ref1 === 'png' || ref1 === 'jpg' || ref1 === 'jpeg' || ref1 === 'svg' || ref1 === 'bmp' || ref1 === 'ico';
    };

    File.isText = function(file) {
        var ref1;
        return (ref1 = slash.ext(file)) === 'koffee' || ref1 === 'coffee' || ref1 === 'styl' || ref1 === 'swift' || ref1 === 'pug' || ref1 === 'md' || ref1 === 'noon' || ref1 === 'txt' || ref1 === 'json' || ref1 === 'sh' || ref1 === 'py' || ref1 === 'cpp' || ref1 === 'cc' || ref1 === 'c' || ref1 === 'cs' || ref1 === 'h' || ref1 === 'hpp' || ref1 === 'ts' || ref1 === 'js';
    };

    File.rename = function(from, to, cb) {
        return fs.mkdir(slash.dir(to), {
            recursive: true
        }, function(err) {
            if (err) {
                return kerror('mkdir failed', err);
            }
            if (slash.isDir(to)) {
                to = slash.join(to, slash.file(from));
            }
            return fs.move(from, to, {
                overwrite: true
            }, function(err) {
                if (err) {
                    return kerror('rename failed', err);
                }
                return cb(from, to);
            });
        });
    };

    File.copy = function(from, to, cb) {
        var unusedFilename;
        if (slash.dir(from) === to) {
            unusedFilename = require('unused-filename');
            unusedFilename(from).then((function(_this) {
                return function(fileName) {
                    return _this.copy(from, fileName, cb);
                };
            })(this));
            return;
        }
        if (slash.isDir(to)) {
            to = slash.join(to, slash.file(from));
        } else {
            to = slash.join(slash.dir(to), slash.file(from));
        }
        return fs.copy(from, to, function(err) {
            if (err) {
                return kerror('copy failed', err);
            }
            return cb(from, to);
        });
    };

    File.iconClassName = function(file) {
        var clss;
        clss = icons.ext[slash.ext(file)];
        if (clss != null) {
            clss;
        } else {
            clss = icons.base[slash.base(file).toLowerCase()];
        }
        if (clss != null) {
            clss;
        } else {
            clss = 'file';
        }
        return "icon " + clss;
    };

    File.span = function(text) {
        var base, clss, ext, span;
        base = slash.base(text);
        ext = slash.ext(text).toLowerCase();
        clss = valid(ext) && ' ' + ext || '';
        if (base.startsWith('.')) {
            clss += ' dotfile';
        }
        span = ("<span class='text" + clss + "'>") + base + "</span>";
        if (valid(ext)) {
            span += ("<span class='ext punct" + clss + "'>.</span>") + ("<span class='ext text" + clss + "'>") + ext + "</span>";
        }
        return span;
    };

    File.crumbSpan = function(file) {
        var i, j, ref1, s, spans, split;
        if (file === '/' || file === '') {
            return "<span>/</span>";
        }
        spans = [];
        split = slash.split(file);
        for (i = j = 0, ref1 = split.length - 1; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            s = split[i];
            spans.push("<div class='inline path' id='" + (split.slice(0, +i + 1 || 9e9).join('/')) + "'>" + s + "</div>");
        }
        spans.push("<div class='inline' id='" + file + "'>" + split.slice(-1)[0] + "</div>");
        return spans.join("<span class='punct'>/</span>");
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQyxJQUFEO0FBQVUsWUFBQTt1QkFBQSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsRUFBQSxLQUFvQixLQUFwQixJQUFBLElBQUEsS0FBMEIsS0FBMUIsSUFBQSxJQUFBLEtBQWdDLEtBQWhDLElBQUEsSUFBQSxLQUFzQyxNQUF0QyxJQUFBLElBQUEsS0FBNkMsS0FBN0MsSUFBQSxJQUFBLEtBQW1ELEtBQW5ELElBQUEsSUFBQSxLQUF5RDtJQUFuRTs7SUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLFNBQUMsSUFBRDtBQUFVLFlBQUE7dUJBQUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLEVBQUEsS0FBb0IsUUFBcEIsSUFBQSxJQUFBLEtBQTZCLFFBQTdCLElBQUEsSUFBQSxLQUFzQyxNQUF0QyxJQUFBLElBQUEsS0FBNkMsT0FBN0MsSUFBQSxJQUFBLEtBQXFELEtBQXJELElBQUEsSUFBQSxLQUEyRCxJQUEzRCxJQUFBLElBQUEsS0FBZ0UsTUFBaEUsSUFBQSxJQUFBLEtBQXVFLEtBQXZFLElBQUEsSUFBQSxLQUE2RSxNQUE3RSxJQUFBLElBQUEsS0FBb0YsSUFBcEYsSUFBQSxJQUFBLEtBQXlGLElBQXpGLElBQUEsSUFBQSxLQUE4RixLQUE5RixJQUFBLElBQUEsS0FBb0csSUFBcEcsSUFBQSxJQUFBLEtBQXlHLEdBQXpHLElBQUEsSUFBQSxLQUE2RyxJQUE3RyxJQUFBLElBQUEsS0FBa0gsR0FBbEgsSUFBQSxJQUFBLEtBQXNILEtB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QUFJLENBQUMsVUFBTCxDQUFnQixHQUFoQixDQUFIO1lBQTRCLElBQUEsSUFBUSxXQUFwQzs7UUFFQSxJQUFBLEdBQU8sQ0FBQSxtQkFBQSxHQUFvQixJQUFwQixHQUF5QixJQUF6QixDQUFBLEdBQTZCLElBQTdCLEdBQWtDO1FBRXpDLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDtZQUNJLElBQUEsSUFBUSxDQUFBLHdCQUFBLEdBQXlCLElBQXpCLEdBQThCLFlBQTlCLENBQUEsR0FBNEMsQ0FBQSx1QkFBQSxHQUF3QixJQUF4QixHQUE2QixJQUE3QixDQUE1QyxHQUE2RSxHQUE3RSxHQUFpRixVQUQ3Rjs7ZUFFQTtJQVpHOztJQWNQLElBQUMsQ0FBQSxTQUFELEdBQVksU0FBQyxJQUFEO0FBRVIsWUFBQTtRQUFBLElBQTJCLElBQUEsS0FBUyxHQUFULElBQUEsSUFBQSxLQUFhLEVBQXhDO0FBQUEsbUJBQU8saUJBQVA7O1FBRUEsS0FBQSxHQUFRO1FBQ1IsS0FBQSxHQUFRLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWjtBQUVSLGFBQVMsOEZBQVQ7WUFDSSxDQUFBLEdBQUksS0FBTSxDQUFBLENBQUE7WUFDVixLQUFLLENBQUMsSUFBTixDQUFXLCtCQUFBLEdBQStCLENBQUMsS0FBTSx3QkFBSyxDQUFDLElBQVosQ0FBaUIsR0FBakIsQ0FBRCxDQUEvQixHQUFxRCxJQUFyRCxHQUF5RCxDQUF6RCxHQUEyRCxRQUF0RTtBQUZKO1FBR0EsS0FBSyxDQUFDLElBQU4sQ0FBVywwQkFBQSxHQUEyQixJQUEzQixHQUFnQyxJQUFoQyxHQUFvQyxLQUFNLFVBQUUsQ0FBQSxDQUFBLENBQTVDLEdBQThDLFFBQXpEO0FBQ0EsZUFBTyxLQUFLLENBQUMsSUFBTixDQUFXLDhCQUFYO0lBWEM7Ozs7OztBQWFoQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBzbGFzaCwgdmFsaWQsIGtsb2csIGZzLCBrZXJyb3IgfSA9IHJlcXVpcmUgJ2t4aydcblxuaWNvbnMgPSByZXF1aXJlICcuL2ljb25zLmpzb24nXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICBAaXNJbWFnZTogKGZpbGUpIC0+IHNsYXNoLmV4dChmaWxlKSBpbiBbJ2dpZicgJ3BuZycgJ2pwZycgJ2pwZWcnICdzdmcnICdibXAnICdpY28nXVxuICAgIEBpc1RleHQ6ICAoZmlsZSkgLT4gc2xhc2guZXh0KGZpbGUpIGluIFsna29mZmVlJyAnY29mZmVlJyAnc3R5bCcgJ3N3aWZ0JyAncHVnJyAnbWQnICdub29uJyAndHh0JyAnanNvbicgJ3NoJyAncHknICdjcHAnICdjYycgJ2MnICdjcycgJ2gnICdocHAnICd0cycgJ2pzJ11cbiAgICBcbiAgICBAcmVuYW1lOiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ21rZGlyIGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0Rpcih0bylcbiAgICAgICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gdG8sIHNsYXNoLmZpbGUgZnJvbVxuXG4gICAgICAgICAgICBmcy5tb3ZlIGZyb20sIHRvLCBvdmVyd3JpdGU6dHJ1ZSwgKGVycikgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdyZW5hbWUgZmFpbGVkJyBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgY2IgZnJvbSwgdG9cblxuICAgIEBjb3B5OiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guZGlyKGZyb20pID09IHRvXG4gICAgICAgICAgICB1bnVzZWRGaWxlbmFtZSA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lKGZyb20pLnRoZW4gKGZpbGVOYW1lKSA9PiBcbiAgICAgICAgICAgICAgICBAY29weSBmcm9tLCBmaWxlTmFtZSwgY2JcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHRvLCBzbGFzaC5maWxlIGZyb21cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHNsYXNoLmRpcih0byksIHNsYXNoLmZpbGUgZnJvbVxuXG4gICAgICAgIGZzLmNvcHkgZnJvbSwgdG8sIChlcnIpIC0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdjb3B5IGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgY2IgZnJvbSwgdG9cbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBjbHNzICA9IGljb25zLmV4dFtzbGFzaC5leHQgZmlsZV1cbiAgICAgICAgY2xzcyA/PSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgY2xzcyA/PSAnZmlsZSdcbiAgICAgICAgXCJpY29uICN7Y2xzc31cIlxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQHNwYW46ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgYmFzZSA9IHNsYXNoLmJhc2UgdGV4dFxuICAgICAgICBleHQgID0gc2xhc2guZXh0KHRleHQpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgY2xzcyA9IHZhbGlkKGV4dCkgYW5kICcgJytleHQgb3IgJydcbiAgICAgICAgXG4gICAgICAgIGlmIGJhc2Uuc3RhcnRzV2l0aCAnLicgdGhlbiBjbHNzICs9ICcgZG90ZmlsZSdcbiAgICAgICAgXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgZXh0XG4gICAgICAgICAgICBzcGFuICs9IFwiPHNwYW4gY2xhc3M9J2V4dCBwdW5jdCN7Y2xzc30nPi48L3NwYW4+XCIgKyBcIjxzcGFuIGNsYXNzPSdleHQgdGV4dCN7Y2xzc30nPlwiK2V4dCtcIjwvc3Bhbj5cIlxuICAgICAgICBzcGFuXG4gICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwiPHNwYW4+Lzwvc3Bhbj5cIiBpZiBmaWxlIGluIFsnLycgJyddXG4gICAgICAgIFxuICAgICAgICBzcGFucyA9IFtdXG4gICAgICAgIHNwbGl0ID0gc2xhc2guc3BsaXQgZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHMgPSBzcGxpdFtpXVxuICAgICAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZSBwYXRoJyBpZD0nI3tzcGxpdFswLi5pXS5qb2luICcvJ30nPiN7c308L2Rpdj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lJyBpZD0nI3tmaWxlfSc+I3tzcGxpdFstMV19PC9kaXY+XCJcbiAgICAgICAgcmV0dXJuIHNwYW5zLmpvaW4gXCI8c3BhbiBjbGFzcz0ncHVuY3QnPi88L3NwYW4+XCJcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../../coffee/tools/file.coffee