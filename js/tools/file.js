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
            return fs.rename(from, to, function(err) {
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
        return fs.copyFile(from, to, function(err) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQyxJQUFEO0FBQVUsWUFBQTt1QkFBQSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsRUFBQSxLQUFvQixLQUFwQixJQUFBLElBQUEsS0FBMEIsS0FBMUIsSUFBQSxJQUFBLEtBQWdDLEtBQWhDLElBQUEsSUFBQSxLQUFzQyxNQUF0QyxJQUFBLElBQUEsS0FBNkMsS0FBN0MsSUFBQSxJQUFBLEtBQW1ELEtBQW5ELElBQUEsSUFBQSxLQUF5RDtJQUFuRTs7SUFFVixJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLEVBQVAsRUFBVyxFQUFYO2VBRUwsRUFBRSxDQUFDLEtBQUgsQ0FBUyxLQUFLLENBQUMsR0FBTixDQUFVLEVBQVYsQ0FBVCxFQUF3QjtZQUFBLFNBQUEsRUFBVSxJQUFWO1NBQXhCLEVBQXdDLFNBQUMsR0FBRDtZQUVwQyxJQUFvQyxHQUFwQztBQUFBLHVCQUFPLE1BQUEsQ0FBTyxjQUFQLEVBQXNCLEdBQXRCLEVBQVA7O1lBRUEsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLEVBQVosQ0FBSDtnQkFDSSxFQUFBLEdBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxFQUFYLEVBQWUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQWYsRUFEVDs7bUJBS0EsRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CLFNBQUMsR0FBRDtnQkFDaEIsSUFBcUMsR0FBckM7QUFBQSwyQkFBTyxNQUFBLENBQU8s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Q0FBQyxJQUFOLENBQVcsK0JBQUEsR0FBK0IsQ0FBQyxLQUFNLHdCQUFLLENBQUMsSUFBWixDQUFpQixHQUFqQixDQUFELENBQS9CLEdBQXFELElBQXJELEdBQXlELENBQXpELEdBQTJELFFBQXRFO0FBRko7UUFHQSxLQUFLLENBQUMsSUFBTixDQUFXLDBCQUFBLEdBQTJCLElBQTNCLEdBQWdDLElBQWhDLEdBQW9DLEtBQU0sVUFBRSxDQUFBLENBQUEsQ0FBNUMsR0FBOEMsUUFBekQ7QUFDQSxlQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsOEJBQVg7SUFYQzs7Ozs7O0FBYWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IHNsYXNoLCB2YWxpZCwga2xvZywgZnMsIGtlcnJvciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5pY29ucyA9IHJlcXVpcmUgJy4vaWNvbnMuanNvbidcblxuY2xhc3MgRmlsZVxuICAgIFxuICAgIEBpc0ltYWdlOiAoZmlsZSkgLT4gc2xhc2guZXh0KGZpbGUpIGluIFsnZ2lmJyAncG5nJyAnanBnJyAnanBlZycgJ3N2ZycgJ2JtcCcgJ2ljbyddXG4gICAgXG4gICAgQHJlbmFtZTogKGZyb20sIHRvLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGZzLm1rZGlyIHNsYXNoLmRpcih0byksIHJlY3Vyc2l2ZTp0cnVlLCAoZXJyKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdta2RpciBmYWlsZWQnIGVyciBpZiBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIodG8pXG4gICAgICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHRvLCBzbGFzaC5maWxlIGZyb21cbiAgICAgICAgICAgICMgZWxzZVxuICAgICAgICAgICAgICAgICMgdG8gPSBzbGFzaC5qb2luIHNsYXNoLmRpcih0byksIHNsYXNoLmZpbGUgZnJvbVxuICAgICAgICAgICAgIyBrbG9nIFwicmVuYW1lICN7ZnJvbX0gI3t0b31cIlxuICAgICAgICAgICAgZnMucmVuYW1lIGZyb20sIHRvLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ3JlbmFtZSBmYWlsZWQnIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICBjYiBmcm9tLCB0b1xuXG4gICAgQGNvcHk6IChmcm9tLCB0bywgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5kaXIoZnJvbSkgPT0gdG9cbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICAgICAgdW51c2VkRmlsZW5hbWUoZnJvbSkudGhlbiAoZmlsZU5hbWUpID0+IFxuICAgICAgICAgICAgICAgIEBjb3B5IGZyb20sIGZpbGVOYW1lLCBjYlxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIodG8pXG4gICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gdG8sIHNsYXNoLmZpbGUgZnJvbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKHRvKSwgc2xhc2guZmlsZSBmcm9tXG4gICAgICAgICMga2xvZyBcImNvcHlGaWxlICN7ZnJvbX0gI3t0b31cIiAgICBcbiAgICAgICAgZnMuY29weUZpbGUgZnJvbSwgdG8sIChlcnIpIC0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdjb3B5IGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgY2IgZnJvbSwgdG9cbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBjbHNzICA9IGljb25zLmV4dFtzbGFzaC5leHQgZmlsZV1cbiAgICAgICAgY2xzcyA/PSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgY2xzcyA/PSAnZmlsZSdcbiAgICAgICAgXCJpY29uICN7Y2xzc31cIlxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQHNwYW46ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgYmFzZSA9IHNsYXNoLmJhc2UgdGV4dFxuICAgICAgICBleHQgID0gc2xhc2guZXh0KHRleHQpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgY2xzcyA9IHZhbGlkKGV4dCkgYW5kICcgJytleHQgb3IgJydcbiAgICAgICAgXG4gICAgICAgIGlmIGJhc2Uuc3RhcnRzV2l0aCAnLicgdGhlbiBjbHNzICs9ICcgZG90ZmlsZSdcbiAgICAgICAgXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgZXh0XG4gICAgICAgICAgICBzcGFuICs9IFwiPHNwYW4gY2xhc3M9J2V4dCBwdW5jdCN7Y2xzc30nPi48L3NwYW4+XCIgKyBcIjxzcGFuIGNsYXNzPSdleHQgdGV4dCN7Y2xzc30nPlwiK2V4dCtcIjwvc3Bhbj5cIlxuICAgICAgICBzcGFuXG4gICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwiPHNwYW4+Lzwvc3Bhbj5cIiBpZiBmaWxlIGluIFsnLycgJyddXG4gICAgICAgIFxuICAgICAgICBzcGFucyA9IFtdXG4gICAgICAgIHNwbGl0ID0gc2xhc2guc3BsaXQgZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHMgPSBzcGxpdFtpXVxuICAgICAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZSBwYXRoJyBpZD0nI3tzcGxpdFswLi5pXS5qb2luICcvJ30nPiN7c308L2Rpdj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lJyBpZD0nI3tmaWxlfSc+I3tzcGxpdFstMV19PC9kaXY+XCJcbiAgICAgICAgcmV0dXJuIHNwYW5zLmpvaW4gXCI8c3BhbiBjbGFzcz0ncHVuY3QnPi88L3NwYW4+XCJcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../../coffee/tools/file.coffee