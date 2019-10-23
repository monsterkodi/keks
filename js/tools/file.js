// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, fs, icons, kerror, klog, ref, slash, unused, valid;

ref = require('kxk'), slash = ref.slash, valid = ref.valid, klog = ref.klog, fs = ref.fs, kerror = ref.kerror;

icons = require('./icons.json');

unused = require('unused-filename');

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
        return unused(from).then((function(_this) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVMsT0FBQSxDQUFRLGNBQVI7O0FBQ1QsTUFBQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUjs7QUFFSDs7O0lBRUYsSUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLElBQUQ7QUFBVSxZQUFBO3VCQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixFQUFBLEtBQW9CLEtBQXBCLElBQUEsSUFBQSxLQUEwQixLQUExQixJQUFBLElBQUEsS0FBZ0MsS0FBaEMsSUFBQSxJQUFBLEtBQXNDLE1BQXRDLElBQUEsSUFBQSxLQUE2QyxLQUE3QyxJQUFBLElBQUEsS0FBbUQsS0FBbkQsSUFBQSxJQUFBLEtBQXlEO0lBQW5FOztJQUNWLElBQUMsQ0FBQSxNQUFELEdBQVUsU0FBQyxJQUFEO2VBQVUsS0FBSyxDQUFDLE1BQU4sQ0FBYSxJQUFiO0lBQVY7O0lBRVYsSUFBQyxDQUFBLE1BQUQsR0FBUyxTQUFDLElBQUQsRUFBTyxFQUFQLEVBQVcsRUFBWDtlQUVMLEVBQUUsQ0FBQyxLQUFILENBQVMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxFQUFWLENBQVQsRUFBd0I7WUFBQSxTQUFBLEVBQVUsSUFBVjtTQUF4QixFQUF3QyxTQUFDLEdBQUQ7WUFFcEMsSUFBdUMsR0FBdkM7QUFBQSx1QkFBTyxNQUFBLENBQU8sZUFBQSxHQUFnQixHQUF2QixFQUFQOztZQUVBLElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxFQUFaLENBQUg7Z0JBQ0ksRUFBQSxHQUFLLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBWCxFQUFlLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUFmLEVB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SUFBWixDQUFpQixHQUFqQixDQUFELENBQS9CLEdBQXFELElBQXJELEdBQXlELENBQXpELEdBQTJELFFBQXRFO0FBRko7UUFHQSxLQUFLLENBQUMsSUFBTixDQUFXLDBCQUFBLEdBQTJCLElBQTNCLEdBQWdDLElBQWhDLEdBQW9DLEtBQU0sVUFBRSxDQUFBLENBQUEsQ0FBNUMsR0FBOEMsUUFBekQ7ZUFDQSxLQUFLLENBQUMsSUFBTixDQUFXLDhCQUFYO0lBWFE7Ozs7OztBQWFoQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBzbGFzaCwgdmFsaWQsIGtsb2csIGZzLCBrZXJyb3IgfSA9IHJlcXVpcmUgJ2t4aydcblxuaWNvbnMgID0gcmVxdWlyZSAnLi9pY29ucy5qc29uJ1xudW51c2VkID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuXG5jbGFzcyBGaWxlXG4gICAgXG4gICAgQGlzSW1hZ2U6IChmaWxlKSAtPiBzbGFzaC5leHQoZmlsZSkgaW4gWydnaWYnICdwbmcnICdqcGcnICdqcGVnJyAnc3ZnJyAnYm1wJyAnaWNvJ11cbiAgICBAaXNUZXh0OiAgKGZpbGUpIC0+IHNsYXNoLmlzVGV4dCBmaWxlXG4gICAgXG4gICAgQHJlbmFtZTogKGZyb20sIHRvLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGZzLm1rZGlyIHNsYXNoLmRpcih0byksIHJlY3Vyc2l2ZTp0cnVlLCAoZXJyKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwibWtkaXIgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0Rpcih0bylcbiAgICAgICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gdG8sIHNsYXNoLmZpbGUgZnJvbVxuXG4gICAgICAgICAgICBmcy5tb3ZlIGZyb20sIHRvLCBvdmVyd3JpdGU6dHJ1ZSwgKGVycikgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwicmVuYW1lIGZhaWxlZCAje2Vycn1cIiBpZiBlcnJcbiAgICAgICAgICAgICAgICBjYiBmcm9tLCB0b1xuXG4gICAgQGR1cGxpY2F0ZTogKGZyb20sIGNiKSAtPiBcblxuICAgICAgICB1bnVzZWQoZnJvbSkudGhlbiAodGFyZ2V0KSA9PiAgICAgICAgICBcbiAgICAgICAgICAgIEBjb3B5IGZyb20sIHRhcmdldCwgY2JcbiAgICBcbiAgICBAY29weTogKGZyb20sIHRvLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHRvLCBzbGFzaC5maWxlIGZyb21cblxuICAgICAgICAjIGtsb2cgXCJjb3B5ICN7ZnJvbX0gI3t0b31cIlxuICAgICAgICBmcy5jb3B5IGZyb20sIHRvLCAoZXJyKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcImNvcHkgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgY2IgZnJvbSwgdG9cbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBjbHNzICA9IGljb25zLmV4dFtzbGFzaC5leHQgZmlsZV1cbiAgICAgICAgY2xzcyA/PSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgY2xzcyA/PSAnZmlsZSdcbiAgICAgICAgXCJpY29uICN7Y2xzc31cIlxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQHNwYW46ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgYmFzZSA9IHNsYXNoLmJhc2UgdGV4dFxuICAgICAgICBleHQgID0gc2xhc2guZXh0KHRleHQpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgY2xzcyA9IHZhbGlkKGV4dCkgYW5kICcgJytleHQgb3IgJydcbiAgICAgICAgXG4gICAgICAgIGlmIGJhc2Uuc3RhcnRzV2l0aCAnLicgdGhlbiBjbHNzICs9ICcgZG90ZmlsZSdcbiAgICAgICAgXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgZXh0XG4gICAgICAgICAgICBzcGFuICs9IFwiPHNwYW4gY2xhc3M9J2V4dCBwdW5jdCN7Y2xzc30nPi48L3NwYW4+XCIgKyBcIjxzcGFuIGNsYXNzPSdleHQgdGV4dCN7Y2xzc30nPlwiK2V4dCtcIjwvc3Bhbj5cIlxuICAgICAgICBzcGFuXG4gICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwiPHNwYW4+Lzwvc3Bhbj5cIiBpZiBmaWxlIGluIFsnLycgJyddXG4gICAgICAgIFxuICAgICAgICBzcGFucyA9IFtdXG4gICAgICAgIHNwbGl0ID0gc2xhc2guc3BsaXQgZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHMgPSBzcGxpdFtpXVxuICAgICAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZSBwYXRoJyBpZD0nI3tzcGxpdFswLi5pXS5qb2luICcvJ30nPiN7c308L2Rpdj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lJyBpZD0nI3tmaWxlfSc+I3tzcGxpdFstMV19PC9kaXY+XCJcbiAgICAgICAgc3BhbnMuam9pbiBcIjxzcGFuIGNsYXNzPSdwdW5jdCc+Lzwvc3Bhbj5cIlxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gRmlsZVxuIl19
//# sourceURL=../../coffee/tools/file.coffee