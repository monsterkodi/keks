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
        var ref1;
        return (ref1 = slash.ext(file)) === 'koffee' || ref1 === 'coffee' || ref1 === 'styl' || ref1 === 'swift' || ref1 === 'pug' || ref1 === 'md' || ref1 === 'noon' || ref1 === 'txt' || ref1 === 'json' || ref1 === 'sh' || ref1 === 'py' || ref1 === 'cpp' || ref1 === 'cc' || ref1 === 'c' || ref1 === 'cs' || ref1 === 'css' || ref1 === 'h' || ref1 === 'hpp' || ref1 === 'html' || ref1 === 'ts' || ref1 === 'js';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVMsT0FBQSxDQUFRLGNBQVI7O0FBQ1QsTUFBQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUjs7QUFFSDs7O0lBRUYsSUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLElBQUQ7QUFBVSxZQUFBO3VCQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixFQUFBLEtBQW9CLEtBQXBCLElBQUEsSUFBQSxLQUEwQixLQUExQixJQUFBLElBQUEsS0FBZ0MsS0FBaEMsSUFBQSxJQUFBLEtBQXNDLE1BQXRDLElBQUEsSUFBQSxLQUE2QyxLQUE3QyxJQUFBLElBQUEsS0FBbUQsS0FBbkQsSUFBQSxJQUFBLEtBQXlEO0lBQW5FOztJQUNWLElBQUMsQ0FBQSxNQUFELEdBQVUsU0FBQyxJQUFEO0FBQVUsWUFBQTt1QkFBQSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsRUFBQSxLQUFvQixRQUFwQixJQUFBLElBQUEsS0FBNkIsUUFBN0IsSUFBQSxJQUFBLEtBQXNDLE1BQXRDLElBQUEsSUFBQSxLQUE2QyxPQUE3QyxJQUFBLElBQUEsS0FBcUQsS0FBckQsSUFBQSxJQUFBLEtBQTJELElBQTNELElBQUEsSUFBQSxLQUFnRSxNQUFoRSxJQUFBLElBQUEsS0FBdUUsS0FBdkUsSUFBQSxJQUFBLEtBQTZFLE1BQTdFLElBQUEsSUFBQSxLQUFvRixJQUFwRixJQUFBLElBQUEsS0FBeUYsSUFBekYsSUFBQSxJQUFBLEtBQThGLEtBQTlGLElBQUEsSUFBQSxLQUFvRyxJQUFwRyxJQUFBLElBQUEsS0FBeUcsR0FBekcsSUFBQSxJQUFBLEtBQTZHLElBQTdHLElBQUEsSUFB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QixDQUFBLEdBQTZCLElBQTdCLEdBQWtDO1FBRXpDLElBQUcsS0FBQSxDQUFNLEdBQU4sQ0FBSDtZQUNJLElBQUEsSUFBUSxDQUFBLHdCQUFBLEdBQXlCLElBQXpCLEdBQThCLFlBQTlCLENBQUEsR0FBNEMsQ0FBQSx1QkFBQSxHQUF3QixJQUF4QixHQUE2QixJQUE3QixDQUE1QyxHQUE2RSxHQUE3RSxHQUFpRixVQUQ3Rjs7ZUFFQTtJQVpHOztJQWNQLElBQUMsQ0FBQSxTQUFELEdBQVksU0FBQyxJQUFEO0FBRVIsWUFBQTtRQUFBLElBQTJCLElBQUEsS0FBUyxHQUFULElBQUEsSUFBQSxLQUFhLEVBQXhDO0FBQUEsbUJBQU8saUJBQVA7O1FBRUEsS0FBQSxHQUFRO1FBQ1IsS0FBQSxHQUFRLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWjtBQUVSLGFBQVMsOEZBQVQ7WUFDSSxDQUFBLEdBQUksS0FBTSxDQUFBLENBQUE7WUFDVixLQUFLLENBQUMsSUFBTixDQUFXLCtCQUFBLEdBQStCLENBQUMsS0FBTSx3QkFBSyxDQUFDLElBQVosQ0FBaUIsR0FBakIsQ0FBRCxDQUEvQixHQUFxRCxJQUFyRCxHQUF5RCxDQUF6RCxHQUEyRCxRQUF0RTtBQUZKO1FBR0EsS0FBSyxDQUFDLElBQU4sQ0FBVywwQkFBQSxHQUEyQixJQUEzQixHQUFnQyxJQUFoQyxHQUFvQyxLQUFNLFVBQUUsQ0FBQSxDQUFBLENBQTVDLEdBQThDLFFBQXpEO2VBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBVyw4QkFBWDtJQVhROzs7Ozs7QUFhaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgc2xhc2gsIHZhbGlkLCBrbG9nLCBmcywga2Vycm9yIH0gPSByZXF1aXJlICdreGsnXG5cbmljb25zICA9IHJlcXVpcmUgJy4vaWNvbnMuanNvbidcbnVudXNlZCA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcblxuY2xhc3MgRmlsZVxuICAgIFxuICAgIEBpc0ltYWdlOiAoZmlsZSkgLT4gc2xhc2guZXh0KGZpbGUpIGluIFsnZ2lmJyAncG5nJyAnanBnJyAnanBlZycgJ3N2ZycgJ2JtcCcgJ2ljbyddXG4gICAgQGlzVGV4dDogIChmaWxlKSAtPiBzbGFzaC5leHQoZmlsZSkgaW4gWydrb2ZmZWUnICdjb2ZmZWUnICdzdHlsJyAnc3dpZnQnICdwdWcnICdtZCcgJ25vb24nICd0eHQnICdqc29uJyAnc2gnICdweScgJ2NwcCcgJ2NjJyAnYycgJ2NzJyAnY3NzJyAnaCcgJ2hwcCcgJ2h0bWwnICd0cycgJ2pzJ11cbiAgICBcbiAgICBAcmVuYW1lOiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJta2RpciBmYWlsZWQgI3tlcnJ9XCIgaWYgZXJyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgICAgIHRvID0gc2xhc2guam9pbiB0bywgc2xhc2guZmlsZSBmcm9tXG5cbiAgICAgICAgICAgIGZzLm1vdmUgZnJvbSwgdG8sIG92ZXJ3cml0ZTp0cnVlLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJyZW5hbWUgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgICAgIGNiIGZyb20sIHRvXG5cbiAgICBAZHVwbGljYXRlOiAoZnJvbSwgY2IpIC0+IFxuXG4gICAgICAgIHVudXNlZChmcm9tKS50aGVuICh0YXJnZXQpID0+ICAgICAgICAgIFxuICAgICAgICAgICAgQGNvcHkgZnJvbSwgdGFyZ2V0LCBjYlxuICAgIFxuICAgIEBjb3B5OiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIodG8pXG4gICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gdG8sIHNsYXNoLmZpbGUgZnJvbVxuXG4gICAgICAgICMga2xvZyBcImNvcHkgI3tmcm9tfSAje3RvfVwiXG4gICAgICAgIGZzLmNvcHkgZnJvbSwgdG8sIChlcnIpIC0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiY29weSBmYWlsZWQgI3tlcnJ9XCIgaWYgZXJyXG4gICAgICAgICAgICBjYiBmcm9tLCB0b1xuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIEBpY29uQ2xhc3NOYW1lOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGNsc3MgID0gaWNvbnMuZXh0W3NsYXNoLmV4dCBmaWxlXVxuICAgICAgICBjbHNzID89IGljb25zLmJhc2Vbc2xhc2guYmFzZShmaWxlKS50b0xvd2VyQ2FzZSgpXVxuICAgICAgICBjbHNzID89ICdmaWxlJ1xuICAgICAgICBcImljb24gI3tjbHNzfVwiXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAc3BhbjogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICBiYXNlID0gc2xhc2guYmFzZSB0ZXh0XG4gICAgICAgIGV4dCAgPSBzbGFzaC5leHQodGV4dCkudG9Mb3dlckNhc2UoKVxuICAgICAgICBjbHNzID0gdmFsaWQoZXh0KSBhbmQgJyAnK2V4dCBvciAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgYmFzZS5zdGFydHNXaXRoICcuJyB0aGVuIGNsc3MgKz0gJyBkb3RmaWxlJ1xuICAgICAgICBcbiAgICAgICAgc3BhbiA9IFwiPHNwYW4gY2xhc3M9J3RleHQje2Nsc3N9Jz5cIitiYXNlK1wiPC9zcGFuPlwiXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBleHRcbiAgICAgICAgICAgIHNwYW4gKz0gXCI8c3BhbiBjbGFzcz0nZXh0IHB1bmN0I3tjbHNzfSc+Ljwvc3Bhbj5cIiArIFwiPHNwYW4gY2xhc3M9J2V4dCB0ZXh0I3tjbHNzfSc+XCIrZXh0K1wiPC9zcGFuPlwiXG4gICAgICAgIHNwYW5cbiAgICAgICAgXG4gICAgQGNydW1iU3BhbjogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gXCI8c3Bhbj4vPC9zcGFuPlwiIGlmIGZpbGUgaW4gWycvJyAnJ11cbiAgICAgICAgXG4gICAgICAgIHNwYW5zID0gW11cbiAgICAgICAgc3BsaXQgPSBzbGFzaC5zcGxpdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLnNwbGl0Lmxlbmd0aC0xXVxuICAgICAgICAgICAgcyA9IHNwbGl0W2ldXG4gICAgICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lIHBhdGgnIGlkPScje3NwbGl0WzAuLmldLmpvaW4gJy8nfSc+I3tzfTwvZGl2PlwiXG4gICAgICAgIHNwYW5zLnB1c2ggXCI8ZGl2IGNsYXNzPSdpbmxpbmUnIGlkPScje2ZpbGV9Jz4je3NwbGl0Wy0xXX08L2Rpdj5cIlxuICAgICAgICBzcGFucy5qb2luIFwiPHNwYW4gY2xhc3M9J3B1bmN0Jz4vPC9zcGFuPlwiXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee