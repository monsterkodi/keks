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
            klog("rename " + from + " " + to);
            return fs.rename(from, to, function(err) {
                if (err) {
                    return kerror('rename failed', err);
                }
                return cb(to);
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
        klog("copyFile " + from + " " + to);
        return fs.copyFile(from, to, function(err) {
            if (err) {
                return kerror('copy failed', err);
            }
            return cb(to);
        });
    };

    File.iconClassName = function(file) {
        var className, clss, ext;
        ext = slash.ext(file);
        switch (ext) {
            case 'noon':
                className = 'icon noon';
                break;
            case 'koffee':
                className = 'icon coffee';
                break;
            case 'xcf':
                className = 'icon gimp';
                break;
            default:
                if (clss = icons.ext[ext]) {
                    className = 'icon ' + clss;
                }
        }
        if (!className) {
            if (clss = icons.base[slash.base(file).toLowerCase()]) {
                className = 'icon ' + clss;
            }
        }
        if (className != null) {
            className;
        } else {
            className = 'icon file';
        }
        return className;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxNQUFELEdBQVMsU0FBQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVg7ZUFFTCxFQUFFLENBQUMsS0FBSCxDQUFTLEtBQUssQ0FBQyxHQUFOLENBQVUsRUFBVixDQUFULEVBQXdCO1lBQUEsU0FBQSxFQUFVLElBQVY7U0FBeEIsRUFBd0MsU0FBQyxHQUFEO1lBRXBDLElBQW9DLEdBQXBDO0FBQUEsdUJBQU8sTUFBQSxDQUFPLGNBQVAsRUFBc0IsR0FBdEIsRUFBUDs7WUFFQSxJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksRUFBWixDQUFIO2dCQUNJLEVBQUEsR0FBSyxLQUFLLENBQUMsSUFBTixDQUFXLEVBQVgsRUFBZSxLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBZixFQURUOztZQUlBLElBQUEsQ0FBSyxTQUFBLEdBQVUsSUFBVixHQUFlLEdBQWYsR0FBa0IsRUFBdkI7bUJBQ0EsRUFBRSxDQUFDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCLEVBQWhCLEVBQW9CLFNBQUMsR0FBRDtnQkFDaEIsSUFBcUMsR0FBckM7QUFBQSwyQkFBTyxNQUFBLENBQU8sZUFBUCxFQUF1QixHQUF2QixFQUFQOzt1QkFDQSxFQUFBLENBQUcsRUFBSDtZQUZnQixDQUFwQjtRQVRvQyxDQUF4QztJQUZLOztJQWVULElBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVg7QUFFSCxZQUFBO1FBQUEsSUFBRyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYs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aUJBQVA7O1FBRUEsS0FBQSxHQUFRO1FBQ1IsS0FBQSxHQUFRLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWjtBQUVSLGFBQVMsOEZBQVQ7WUFDSSxDQUFBLEdBQUksS0FBTSxDQUFBLENBQUE7WUFDVixLQUFLLENBQUMsSUFBTixDQUFXLCtCQUFBLEdBQStCLENBQUMsS0FBTSx3QkFBSyxDQUFDLElBQVosQ0FBaUIsR0FBakIsQ0FBRCxDQUEvQixHQUFxRCxJQUFyRCxHQUF5RCxDQUF6RCxHQUEyRCxRQUF0RTtBQUZKO1FBR0EsS0FBSyxDQUFDLElBQU4sQ0FBVywwQkFBQSxHQUEyQixJQUEzQixHQUFnQyxJQUFoQyxHQUFvQyxLQUFNLFVBQUUsQ0FBQSxDQUFBLENBQTVDLEdBQThDLFFBQXpEO0FBQ0EsZUFBTyxLQUFLLENBQUMsSUFBTixDQUFXLDhCQUFYO0lBWEM7Ozs7OztBQWFoQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBzbGFzaCwgdmFsaWQsIGtsb2csIGZzLCBrZXJyb3IgfSA9IHJlcXVpcmUgJ2t4aydcblxuaWNvbnMgPSByZXF1aXJlICcuL2ljb25zLmpzb24nXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICBAcmVuYW1lOiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ21rZGlyIGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0Rpcih0bylcbiAgICAgICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gdG8sIHNsYXNoLmZpbGUgZnJvbVxuICAgICAgICAgICAgIyBlbHNlXG4gICAgICAgICAgICAgICAgIyB0byA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKHRvKSwgc2xhc2guZmlsZSBmcm9tXG4gICAgICAgICAgICBrbG9nIFwicmVuYW1lICN7ZnJvbX0gI3t0b31cIlxuICAgICAgICAgICAgZnMucmVuYW1lIGZyb20sIHRvLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ3JlbmFtZSBmYWlsZWQnIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICBjYiB0b1xuXG4gICAgQGNvcHk6IChmcm9tLCB0bywgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5kaXIoZnJvbSkgPT0gdG9cbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICAgICAgdW51c2VkRmlsZW5hbWUoZnJvbSkudGhlbiAoZmlsZU5hbWUpID0+IFxuICAgICAgICAgICAgICAgIEBjb3B5IGZyb20sIGZpbGVOYW1lLCBjYlxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIodG8pXG4gICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gdG8sIHNsYXNoLmZpbGUgZnJvbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKHRvKSwgc2xhc2guZmlsZSBmcm9tXG4gICAgICAgIGtsb2cgXCJjb3B5RmlsZSAje2Zyb219ICN7dG99XCIgICAgXG4gICAgICAgIGZzLmNvcHlGaWxlIGZyb20sIHRvLCAoZXJyKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnY29weSBmYWlsZWQnIGVyciBpZiBlcnJcbiAgICAgICAgICAgIGNiIHRvXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQGljb25DbGFzc05hbWU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgZXh0ID0gc2xhc2guZXh0IGZpbGVcbiAgICAgICAgc3dpdGNoIGV4dFxuICAgICAgICAgICAgd2hlbiAnbm9vbicgICB0aGVuIGNsYXNzTmFtZSA9ICdpY29uIG5vb24nXG4gICAgICAgICAgICB3aGVuICdrb2ZmZWUnIHRoZW4gY2xhc3NOYW1lID0gJ2ljb24gY29mZmVlJ1xuICAgICAgICAgICAgd2hlbiAneGNmJyAgICB0aGVuIGNsYXNzTmFtZSA9ICdpY29uIGdpbXAnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgY2xzcyA9IGljb25zLmV4dFtleHRdXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9ICdpY29uICcgKyBjbHNzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgY2xhc3NOYW1lXG4gICAgICAgICAgICBpZiBjbHNzID0gaWNvbnMuYmFzZVtzbGFzaC5iYXNlKGZpbGUpLnRvTG93ZXJDYXNlKCldXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ljb24gJyArIGNsc3NcbiAgICAgICAgY2xhc3NOYW1lID89ICdpY29uIGZpbGUnXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQHNwYW46ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgYmFzZSA9IHNsYXNoLmJhc2UgdGV4dFxuICAgICAgICBleHQgID0gc2xhc2guZXh0KHRleHQpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgY2xzcyA9IHZhbGlkKGV4dCkgYW5kICcgJytleHQgb3IgJydcbiAgICAgICAgXG4gICAgICAgIGlmIGJhc2Uuc3RhcnRzV2l0aCAnLicgdGhlbiBjbHNzICs9ICcgZG90ZmlsZSdcbiAgICAgICAgXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgZXh0XG4gICAgICAgICAgICBzcGFuICs9IFwiPHNwYW4gY2xhc3M9J2V4dCBwdW5jdCN7Y2xzc30nPi48L3NwYW4+XCIgKyBcIjxzcGFuIGNsYXNzPSdleHQgdGV4dCN7Y2xzc30nPlwiK2V4dCtcIjwvc3Bhbj5cIlxuICAgICAgICBzcGFuXG4gICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwiPHNwYW4+Lzwvc3Bhbj5cIiBpZiBmaWxlIGluIFsnLycgJyddXG4gICAgICAgIFxuICAgICAgICBzcGFucyA9IFtdXG4gICAgICAgIHNwbGl0ID0gc2xhc2guc3BsaXQgZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHMgPSBzcGxpdFtpXVxuICAgICAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZSBwYXRoJyBpZD0nI3tzcGxpdFswLi5pXS5qb2luICcvJ30nPiN7c308L2Rpdj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lJyBpZD0nI3tmaWxlfSc+I3tzcGxpdFstMV19PC9kaXY+XCJcbiAgICAgICAgcmV0dXJuIHNwYW5zLmpvaW4gXCI8c3BhbiBjbGFzcz0ncHVuY3QnPi88L3NwYW4+XCJcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../../coffee/tools/file.coffee