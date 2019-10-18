// koffee 1.3.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQyxJQUFEO0FBQVUsWUFBQTt1QkFBQSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsRUFBQSxLQUFvQixLQUFwQixJQUFBLElBQUEsS0FBMEIsS0FBMUIsSUFBQSxJQUFBLEtBQWdDLEtBQWhDLElBQUEsSUFBQSxLQUFzQyxNQUF0QyxJQUFBLElBQUEsS0FBNkMsS0FBN0MsSUFBQSxJQUFBLEtBQW1ELEtBQW5ELElBQUEsSUFBQSxLQUF5RDtJQUFuRTs7SUFFVixJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLEVBQVAsRUFBVyxFQUFYO2VBRUwsRUFBRSxDQUFDLEtBQUgsQ0FBUyxLQUFLLENBQUMsR0FBTixDQUFVLEVBQVYsQ0FBVCxFQUF3QjtZQUFBLFNBQUEsRUFBVSxJQUFWO1NBQXhCLEVBQXdDLFNBQUMsR0FBRDtZQUVwQyxJQUFvQyxHQUFwQztBQUFBLHVCQUFPLE1BQUEsQ0FBTyxjQUFQLEVBQXNCLEdBQXRCLEVBQVA7O1lBRUEsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLEVBQVosQ0FBSDtnQkFDSSxFQUFBLEdBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxFQUFYLEVBQWUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQWYsRUFEVDs7WUFJQSxJQUFBLENBQUssU0FBQSxHQUFVLElBQVYsR0FBZSxHQUFmLEdBQWtCLEVBQXZCO21CQUNBLEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBVixFQUFnQixFQUFoQixFQUFv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Q0FBQSx3QkFBQSxHQUF5QixJQUF6QixHQUE4QixZQUE5QixDQUFBLEdBQTRDLENBQUEsdUJBQUEsR0FBd0IsSUFBeEIsR0FBNkIsSUFBN0IsQ0FBNUMsR0FBNkUsR0FBN0UsR0FBaUYsVUFEN0Y7O2VBRUE7SUFaRzs7SUFjUCxJQUFDLENBQUEsU0FBRCxHQUFZLFNBQUMsSUFBRDtBQUVSLFlBQUE7UUFBQSxJQUEyQixJQUFBLEtBQVMsR0FBVCxJQUFBLElBQUEsS0FBYSxFQUF4QztBQUFBLG1CQUFPLGlCQUFQOztRQUVBLEtBQUEsR0FBUTtRQUNSLEtBQUEsR0FBUSxLQUFLLENBQUMsS0FBTixDQUFZLElBQVo7QUFFUixhQUFTLDhGQUFUO1lBQ0ksQ0FBQSxHQUFJLEtBQU0sQ0FBQSxDQUFBO1lBQ1YsS0FBSyxDQUFDLElBQU4sQ0FBVywrQkFBQSxHQUErQixDQUFDLEtBQU0sd0JBQUssQ0FBQyxJQUFaLENBQWlCLEdBQWpCLENBQUQsQ0FBL0IsR0FBcUQsSUFBckQsR0FBeUQsQ0FBekQsR0FBMkQsUUFBdEU7QUFGSjtRQUdBLEtBQUssQ0FBQyxJQUFOLENBQVcsMEJBQUEsR0FBMkIsSUFBM0IsR0FBZ0MsSUFBaEMsR0FBb0MsS0FBTSxVQUFFLENBQUEsQ0FBQSxDQUE1QyxHQUE4QyxRQUF6RDtBQUNBLGVBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyw4QkFBWDtJQVhDOzs7Ozs7QUFhaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgc2xhc2gsIHZhbGlkLCBrbG9nLCBmcywga2Vycm9yIH0gPSByZXF1aXJlICdreGsnXG5cbmljb25zID0gcmVxdWlyZSAnLi9pY29ucy5qc29uJ1xuXG5jbGFzcyBGaWxlXG4gICAgXG4gICAgQGlzSW1hZ2U6IChmaWxlKSAtPiBzbGFzaC5leHQoZmlsZSkgaW4gWydnaWYnICdwbmcnICdqcGcnICdqcGVnJyAnc3ZnJyAnYm1wJyAnaWNvJ11cbiAgICBcbiAgICBAcmVuYW1lOiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ21rZGlyIGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0Rpcih0bylcbiAgICAgICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gdG8sIHNsYXNoLmZpbGUgZnJvbVxuICAgICAgICAgICAgIyBlbHNlXG4gICAgICAgICAgICAgICAgIyB0byA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKHRvKSwgc2xhc2guZmlsZSBmcm9tXG4gICAgICAgICAgICBrbG9nIFwicmVuYW1lICN7ZnJvbX0gI3t0b31cIlxuICAgICAgICAgICAgZnMucmVuYW1lIGZyb20sIHRvLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ3JlbmFtZSBmYWlsZWQnIGVyciBpZiBlcnJcbiAgICAgICAgICAgICAgICBjYiB0b1xuXG4gICAgQGNvcHk6IChmcm9tLCB0bywgY2IpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5kaXIoZnJvbSkgPT0gdG9cbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lID0gcmVxdWlyZSAndW51c2VkLWZpbGVuYW1lJ1xuICAgICAgICAgICAgdW51c2VkRmlsZW5hbWUoZnJvbSkudGhlbiAoZmlsZU5hbWUpID0+IFxuICAgICAgICAgICAgICAgIEBjb3B5IGZyb20sIGZpbGVOYW1lLCBjYlxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIodG8pXG4gICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gdG8sIHNsYXNoLmZpbGUgZnJvbVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gc2xhc2guZGlyKHRvKSwgc2xhc2guZmlsZSBmcm9tXG4gICAgICAgIGtsb2cgXCJjb3B5RmlsZSAje2Zyb219ICN7dG99XCIgICAgXG4gICAgICAgIGZzLmNvcHlGaWxlIGZyb20sIHRvLCAoZXJyKSAtPlxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnY29weSBmYWlsZWQnIGVyciBpZiBlcnJcbiAgICAgICAgICAgIGNiIHRvXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQGljb25DbGFzc05hbWU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgZXh0ID0gc2xhc2guZXh0IGZpbGVcbiAgICAgICAgc3dpdGNoIGV4dFxuICAgICAgICAgICAgd2hlbiAnbm9vbicgICB0aGVuIGNsYXNzTmFtZSA9ICdpY29uIG5vb24nXG4gICAgICAgICAgICB3aGVuICdrb2ZmZWUnIHRoZW4gY2xhc3NOYW1lID0gJ2ljb24gY29mZmVlJ1xuICAgICAgICAgICAgd2hlbiAneGNmJyAgICB0aGVuIGNsYXNzTmFtZSA9ICdpY29uIGdpbXAnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgY2xzcyA9IGljb25zLmV4dFtleHRdXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9ICdpY29uICcgKyBjbHNzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgY2xhc3NOYW1lXG4gICAgICAgICAgICBpZiBjbHNzID0gaWNvbnMuYmFzZVtzbGFzaC5iYXNlKGZpbGUpLnRvTG93ZXJDYXNlKCldXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lID0gJ2ljb24gJyArIGNsc3NcbiAgICAgICAgY2xhc3NOYW1lID89ICdpY29uIGZpbGUnXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQHNwYW46ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgYmFzZSA9IHNsYXNoLmJhc2UgdGV4dFxuICAgICAgICBleHQgID0gc2xhc2guZXh0KHRleHQpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgY2xzcyA9IHZhbGlkKGV4dCkgYW5kICcgJytleHQgb3IgJydcbiAgICAgICAgXG4gICAgICAgIGlmIGJhc2Uuc3RhcnRzV2l0aCAnLicgdGhlbiBjbHNzICs9ICcgZG90ZmlsZSdcbiAgICAgICAgXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgZXh0XG4gICAgICAgICAgICBzcGFuICs9IFwiPHNwYW4gY2xhc3M9J2V4dCBwdW5jdCN7Y2xzc30nPi48L3NwYW4+XCIgKyBcIjxzcGFuIGNsYXNzPSdleHQgdGV4dCN7Y2xzc30nPlwiK2V4dCtcIjwvc3Bhbj5cIlxuICAgICAgICBzcGFuXG4gICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwiPHNwYW4+Lzwvc3Bhbj5cIiBpZiBmaWxlIGluIFsnLycgJyddXG4gICAgICAgIFxuICAgICAgICBzcGFucyA9IFtdXG4gICAgICAgIHNwbGl0ID0gc2xhc2guc3BsaXQgZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHMgPSBzcGxpdFtpXVxuICAgICAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZSBwYXRoJyBpZD0nI3tzcGxpdFswLi5pXS5qb2luICcvJ30nPiN7c308L2Rpdj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lJyBpZD0nI3tmaWxlfSc+I3tzcGxpdFstMV19PC9kaXY+XCJcbiAgICAgICAgcmV0dXJuIHNwYW5zLmpvaW4gXCI8c3BhbiBjbGFzcz0ncHVuY3QnPi88L3NwYW4+XCJcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../../coffee/tools/file.coffee