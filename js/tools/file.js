// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, fs, icons, kerror, ref, slash, valid;

ref = require('kxk'), slash = ref.slash, valid = ref.valid, fs = ref.fs, kerror = ref.kerror;

icons = require('./icons.json');

File = (function() {
    function File() {}

    File.isImage = function(file) {
        var ref1;
        return (ref1 = slash.ext(file)) === 'gif' || ref1 === 'png' || ref1 === 'jpg' || ref1 === 'jpeg' || ref1 === 'svg' || ref1 === 'bmp' || ref1 === 'ico';
    };

    File.isText = function(file) {
        return slash.isText(file);
    };

    File.rename = function(from, to, cb) {
        return fs.mkdir(slash.dir(to), {
            recursive: true
        }, function(err) {
            if (err) {
                return kerror("mkdir failed " + err);
            }
            if (slash.isDir(to)) {
                to = slash.join(to, slash.file(from));
            }
            return fs.move(from, to, {
                overwrite: true
            }, function(err) {
                if (err) {
                    return kerror("rename failed " + err);
                }
                return cb(from, to);
            });
        });
    };

    File.duplicate = function(from, cb) {
        return slash.unused(from, (function(_this) {
            return function(target) {
                return _this.copy(from, target, cb);
            };
        })(this));
    };

    File.copy = function(from, to, cb) {
        if (slash.isDir(to)) {
            to = slash.join(to, slash.file(from));
        }
        return fs.copy(from, to, function(err) {
            if (err) {
                return kerror("copy failed " + err);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBK0IsT0FBQSxDQUFRLEtBQVIsQ0FBL0IsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLFdBQWhCLEVBQW9COztBQUVwQixLQUFBLEdBQVMsT0FBQSxDQUFRLGNBQVI7O0FBRUg7OztJQUVGLElBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQyxJQUFEO0FBQVUsWUFBQTt1QkFBQSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsRUFBQSxLQUFvQixLQUFwQixJQUFBLElBQUEsS0FBMEIsS0FBMUIsSUFBQSxJQUFBLEtBQWdDLEtBQWhDLElBQUEsSUFBQSxLQUFzQyxNQUF0QyxJQUFBLElBQUEsS0FBNkMsS0FBN0MsSUFBQSxJQUFBLEtBQW1ELEtBQW5ELElBQUEsSUFBQSxLQUF5RDtJQUFuRTs7SUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLFNBQUMsSUFBRDtlQUFVLEtBQUssQ0FBQyxNQUFOLENBQWEsSUFBYjtJQUFWOztJQUVWLElBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVg7ZUFFTCxFQUFFLENBQUMsS0FBSCxDQUFTLEtBQUssQ0FBQyxHQUFOLENBQVUsRUFBVixDQUFULEVBQXdCO1lBQUEsU0FBQSxFQUFVLElBQVY7U0FBeEIsRUFBd0MsU0FBQyxHQUFEO1lBRXBDLElBQXVDLEdBQXZDO0FBQUEsdUJBQU8sTUFBQSxDQUFPLGVBQUEsR0FBZ0IsR0FBdkIsRUFBUDs7WUFFQSxJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksRUFBWixDQUFIO2dCQUNJLEVBQUEsR0FBSyxLQUFLLENBQUMsSUFBTixDQUFXLEVBQVgsRUFBZSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBZixFQURUOzttQkFHQSxFQUFFLENBQUMsSUFBSCxDQUFRLElBQVIsRUFBYyxFQUFk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ekQsR0FBMkQsUUFBdEU7QUFGSjtRQUdBLEtBQUssQ0FBQyxJQUFOLENBQVcsMEJBQUEsR0FBMkIsSUFBM0IsR0FBZ0MsSUFBaEMsR0FBb0MsS0FBTSxVQUFFLENBQUEsQ0FBQSxDQUE1QyxHQUE4QyxRQUF6RDtlQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsOEJBQVg7SUFYUTs7Ozs7O0FBYWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IHNsYXNoLCB2YWxpZCwgZnMsIGtlcnJvciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5pY29ucyAgPSByZXF1aXJlICcuL2ljb25zLmpzb24nXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICBAaXNJbWFnZTogKGZpbGUpIC0+IHNsYXNoLmV4dChmaWxlKSBpbiBbJ2dpZicgJ3BuZycgJ2pwZycgJ2pwZWcnICdzdmcnICdibXAnICdpY28nXVxuICAgIEBpc1RleHQ6ICAoZmlsZSkgLT4gc2xhc2guaXNUZXh0IGZpbGVcbiAgICBcbiAgICBAcmVuYW1lOiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJta2RpciBmYWlsZWQgI3tlcnJ9XCIgaWYgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgICAgIHRvID0gc2xhc2guam9pbiB0bywgc2xhc2guZmlsZSBmcm9tXG5cbiAgICAgICAgICAgIGZzLm1vdmUgZnJvbSwgdG8sIG92ZXJ3cml0ZTp0cnVlLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJyZW5hbWUgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgICAgIGNiIGZyb20sIHRvXG5cbiAgICBAZHVwbGljYXRlOiAoZnJvbSwgY2IpIC0+IFxuXG4gICAgICAgIHNsYXNoLnVudXNlZCBmcm9tLCAodGFyZ2V0KSA9PiAgICAgICAgICBcbiAgICAgICAgICAgIEBjb3B5IGZyb20sIHRhcmdldCwgY2JcbiAgICBcbiAgICBAY29weTogKGZyb20sIHRvLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHRvLCBzbGFzaC5maWxlIGZyb21cblxuICAgICAgICAjIGtsb2cgXCJjb3B5ICN7ZnJvbX0gI3t0b31cIlxuICAgICAgICBmcy5jb3B5IGZyb20sIHRvLCAoZXJyKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNvcHkgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgY2IgZnJvbSwgdG9cbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBjbHNzICA9IGljb25zLmV4dFtzbGFzaC5leHQgZmlsZV1cbiAgICAgICAgY2xzcyA/PSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgY2xzcyA/PSAnZmlsZSdcbiAgICAgICAgXCJpY29uICN7Y2xzc31cIlxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQHNwYW46ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgYmFzZSA9IHNsYXNoLmJhc2UgdGV4dFxuICAgICAgICBleHQgID0gc2xhc2guZXh0KHRleHQpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgY2xzcyA9IHZhbGlkKGV4dCkgYW5kICcgJytleHQgb3IgJydcbiAgICAgICAgXG4gICAgICAgIGlmIGJhc2Uuc3RhcnRzV2l0aCAnLicgdGhlbiBjbHNzICs9ICcgZG90ZmlsZSdcbiAgICAgICAgXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgZXh0XG4gICAgICAgICAgICBzcGFuICs9IFwiPHNwYW4gY2xhc3M9J2V4dCBwdW5jdCN7Y2xzc30nPi48L3NwYW4+XCIgKyBcIjxzcGFuIGNsYXNzPSdleHQgdGV4dCN7Y2xzc30nPlwiK2V4dCtcIjwvc3Bhbj5cIlxuICAgICAgICBzcGFuXG4gICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwiPHNwYW4+Lzwvc3Bhbj5cIiBpZiBmaWxlIGluIFsnLycgJyddXG4gICAgICAgIFxuICAgICAgICBzcGFucyA9IFtdXG4gICAgICAgIHNwbGl0ID0gc2xhc2guc3BsaXQgZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHMgPSBzcGxpdFtpXVxuICAgICAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZSBwYXRoJyBpZD0nI3tzcGxpdFswLi5pXS5qb2luICcvJ30nPiN7c308L2Rpdj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lJyBpZD0nI3tmaWxlfSc+I3tzcGxpdFstMV19PC9kaXY+XCJcbiAgICAgICAgc3BhbnMuam9pbiBcIjxzcGFuIGNsYXNzPSdwdW5jdCc+Lzwvc3Bhbj5cIlxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gRmlsZVxuIl19
//# sourceURL=../../coffee/tools/file.coffee