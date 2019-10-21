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
        return (ref1 = slash.ext(file)) === 'koffee' || ref1 === 'coffee' || ref1 === 'styl' || ref1 === 'swift' || ref1 === 'pug' || ref1 === 'md' || ref1 === 'noon' || ref1 === 'txt' || ref1 === 'json' || ref1 === 'sh' || ref1 === 'py' || ref1 === 'cpp' || ref1 === 'cc' || ref1 === 'c' || ref1 === 'cs' || ref1 === 'css' || ref1 === 'h' || ref1 === 'hpp' || ref1 === 'html' || ref1 === 'ts' || ref1 === 'js';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUUxQixLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0FBRUY7OztJQUVGLElBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQyxJQUFEO0FBQVUsWUFBQTt1QkFBQSxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsRUFBQSxLQUFvQixLQUFwQixJQUFBLElBQUEsS0FBMEIsS0FBMUIsSUFBQSxJQUFBLEtBQWdDLEtBQWhDLElBQUEsSUFBQSxLQUFzQyxNQUF0QyxJQUFBLElBQUEsS0FBNkMsS0FBN0MsSUFBQSxJQUFBLEtBQW1ELEtBQW5ELElBQUEsSUFBQSxLQUF5RDtJQUFuRTs7SUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLFNBQUMsSUFBRDtBQUFVLFlBQUE7dUJBQUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLEVBQUEsS0FBb0IsUUFBcEIsSUFBQSxJQUFBLEtBQTZCLFFBQTdCLElBQUEsSUFBQSxLQUFzQyxNQUF0QyxJQUFBLElBQUEsS0FBNkMsT0FBN0MsSUFBQSxJQUFBLEtBQXFELEtBQXJELElBQUEsSUFBQSxLQUEyRCxJQUEzRCxJQUFBLElBQUEsS0FBZ0UsTUFBaEUsSUFBQSxJQUFBLEtBQXVFLEtBQXZFLElBQUEsSUFBQSxLQUE2RSxNQUE3RSxJQUFBLElBQUEsS0FBb0YsSUFBcEYsSUFBQSxJQUFBLEtBQXlGLElBQXpGLElBQUEsSUFBQSxLQUE4RixLQUE5RixJQUFBLElBQUEsS0FBb0csSUFBcEcsSUFBQSxJQUFBLEtBQXlHLEdBQXpHLElBQUEsSUFBQSxLQUE2RyxJQUE3RyxJQUFBLElBQUEsS0FBa0gsS0FBbEgsSUFBQSxJQUFBLEtBQXdILEdBQXhILElBQUEsSUFBQSxLQUE0SCxLQUE1SCxJQUFBLElBQUEsS0FBa0ksTUFBbEksSUFBQSxJQUFBLEtBQXlJLElBQXpJLElBQUEsSUFBQSxLQUE4STtJQUF4Sjs7SUFFVixJQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsSUFBRCxFQUFPLEVBQVAsRUFBVyxFQUFYO2VBRUwsRUFBRSxDQUFDLEtBQUgsQ0FBUyxLQUFLLENBQUMsR0FBTixDQUFVLEVBQVYsQ0FBVCxFQUF3QjtZQUFBLFNBQUEsRUFBVSxJQUFWO1NBQXhCLEVBQXdDLFNBQUMsR0FBRDtZQUVwQyxJQUFvQyxHQUFwQztBQUFBLHVCQUFPLE1BQUEsQ0FBTyxjQUFQLEVBQXNCLEdBQXRCLEVBQVA7O1lBRUEsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLEVBQVosQ0FBSDtnQkFDSSxFQUFBLEdBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxFQUFYLEVBQWUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQWYsRUFEVDs7bUJBR0EsRUFBRSxDQUFDLElBQUgsQ0FBUSxJQUFSLEVBQWMsRUFBZCxFQUFrQjtnQkFBQSxTQUFBLEVBQVUsSUFBVjthQUFsQixFQUFrQyxTQUFDLEdBQUQ7Z0JBQzlCLElBQXFDLEdBQXJDO0FBQUEsMkJBQU8sTUFBQSxDQUFPLGVBQVAsRUFBdUIsR0FBdkIsRUFBUDs7dUJBQ0EsRUFBQSxDQUFHLElBQUgsRUFBUyxFQUFUO1lBRjhCLENBQWxDO1FBUG9DLENBQXhDO0lBRks7O0lBYVQsSUFBQyxDQUFBLElBQUQsR0FBTyxTQUFDLElBQUQsRUFBTyxFQUFQLEVBQVcsRUFBWDtBQUVILFlBQUE7UUFBQSxJQUFHLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFBLEtBQW1CLEVBQXRCO1lBQ0ksY0FBQSxHQUFpQixPQUFBLENBQVEsaUJBQVI7WUFDakIsY0FBQSxDQUFlLElBQWYsQ0FBb0IsQ0FBQyxJQUFyQixDQUEwQixDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFDLFFBQUQ7MkJBQ3RCLEtBQUMsQ0FBQSxJQUFELENBQU0sSUFBTixFQUFZLFFBQVosRUFBc0IsRUFBdEI7Z0JBRHNCO1lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExQjtBQUVBLG1CQUpKOztRQU1BLElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxFQUFaLENBQUg7WUFDSSxFQUFBLEdBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxFQUFYLEVBQWUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQWYsRUFEVDtTQUFBLE1BQUE7WUFHSSxFQUFBLEdBQUssS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFLLENBQUMsR0FBTixDQUFVLEVBQVYsQ0FBWCxFQUEwQixLQUFLLENBQUMsSUFBTixDQUFXLElBQVgsQ0FBMUIsRUFIVDs7ZUFLQSxFQUFFLENBQUMsSUFBSCxDQUFRLElBQVIsRUFBYyxFQUFkLEVBQWtCLFNBQUMsR0FBRDtZQUNkLElBQW1DLEdBQW5DO0FBQUEsdUJBQU8sTUFBQSxDQUFPLGFBQVAsRUFBcUIsR0FBckIsRUFBUDs7bUJBQ0EsRUFBQSxDQUFHLElBQUgsRUFBUyxFQUFUO1FBRmMsQ0FBbEI7SUFiRzs7SUF1QlAsSUFBQyxDQUFBLGFBQUQsR0FBZ0IsU0FBQyxJQUFEO0FBRVosWUFBQTtRQUFBLElBQUEsR0FBUSxLQUFLLENBQUMsR0FBSSxDQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFBOztZQUNsQjs7WUFBQSxPQUFRLEtBQUssQ0FBQyxJQUFLLENBQUEsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLENBQWdCLENBQUMsV0FBakIsQ0FBQSxDQUFBOzs7WUFDbkI7O1lBQUEsT0FBUTs7ZUFDUixPQUFBLEdBQVE7SUFMSTs7SUFhaEIsSUFBQyxDQUFBLElBQUQsR0FBTyxTQUFDLElBQUQ7QUFFSCxZQUFBO1FBQUEsSUFBQSxHQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWDtRQUNQLEdBQUEsR0FBTyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBZSxDQUFDLFdBQWhCLENBQUE7UUFDUCxJQUFBLEdBQU8sS0FBQSxDQUFNLEdBQU4sQ0FBQSxJQUFlLEdBQUEsR0FBSSxHQUFuQixJQUEwQjtRQUVqQyxJQUFHLElBQUksQ0FBQyxVQUFMLENBQWdCLEdBQWhCLENBQUg7WUFBNEIsSUFBQSxJQUFRLFdBQXBDOztRQUVBLElBQUEsR0FBTyxDQUFBLG1CQUFBLEdBQW9CLElBQXBCLEdBQXlCLElBQXpCLENBQUEsR0FBNkIsSUFBN0IsR0FBa0M7UUFFekMsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIO1lBQ0ksSUFBQSxJQUFRLENBQUEsd0JBQUEsR0FBeUIsSUFBekIsR0FBOEIsWUFBOUIsQ0FBQSxHQUE0QyxDQUFBLHVCQUFBLEdBQXdCLElBQXhCLEdBQTZCLElBQTdCLENBQTVDLEdBQTZFLEdBQTdFLEdBQWlGLFVBRDdGOztlQUVBO0lBWkc7O0lBY1AsSUFBQyxDQUFBLFNBQUQsR0FBWSxTQUFDLElBQUQ7QUFFUixZQUFBO1FBQUEsSUFBMkIsSUFBQSxLQUFTLEdBQVQsSUFBQSxJQUFBLEtBQWEsRUFBeEM7QUFBQSxtQkFBTyxpQkFBUDs7UUFFQSxLQUFBLEdBQVE7UUFDUixLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaO0FBRVIsYUFBUyw4RkFBVDtZQUNJLENBQUEsR0FBSSxLQUFNLENBQUEsQ0FBQTtZQUNWLEtBQUssQ0FBQyxJQUFOLENBQVcsK0JBQUEsR0FBK0IsQ0FBQyxLQUFNLHdCQUFLLENBQUMsSUFBWixDQUFpQixHQUFqQixDQUFELENBQS9CLEdBQXFELElBQXJELEdBQXlELENBQXpELEdBQTJELFFBQXRFO0FBRko7UUFHQSxLQUFLLENBQUMsSUFBTixDQUFXLDBCQUFBLEdBQTJCLElBQTNCLEdBQWdDLElBQWhDLEdBQW9DLEtBQU0sVUFBRSxDQUFBLENBQUEsQ0FBNUMsR0FBOEMsUUFBekQ7QUFDQSxlQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsOEJBQVg7SUFYQzs7Ozs7O0FBYWhCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMjI1xuXG57IHNsYXNoLCB2YWxpZCwga2xvZywgZnMsIGtlcnJvciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5pY29ucyA9IHJlcXVpcmUgJy4vaWNvbnMuanNvbidcblxuY2xhc3MgRmlsZVxuICAgIFxuICAgIEBpc0ltYWdlOiAoZmlsZSkgLT4gc2xhc2guZXh0KGZpbGUpIGluIFsnZ2lmJyAncG5nJyAnanBnJyAnanBlZycgJ3N2ZycgJ2JtcCcgJ2ljbyddXG4gICAgQGlzVGV4dDogIChmaWxlKSAtPiBzbGFzaC5leHQoZmlsZSkgaW4gWydrb2ZmZWUnICdjb2ZmZWUnICdzdHlsJyAnc3dpZnQnICdwdWcnICdtZCcgJ25vb24nICd0eHQnICdqc29uJyAnc2gnICdweScgJ2NwcCcgJ2NjJyAnYycgJ2NzJyAnY3NzJyAnaCcgJ2hwcCcgJ2h0bWwnICd0cycgJ2pzJ11cbiAgICBcbiAgICBAcmVuYW1lOiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgZnMubWtkaXIgc2xhc2guZGlyKHRvKSwgcmVjdXJzaXZlOnRydWUsIChlcnIpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ21rZGlyIGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0Rpcih0bylcbiAgICAgICAgICAgICAgICB0byA9IHNsYXNoLmpvaW4gdG8sIHNsYXNoLmZpbGUgZnJvbVxuXG4gICAgICAgICAgICBmcy5tb3ZlIGZyb20sIHRvLCBvdmVyd3JpdGU6dHJ1ZSwgKGVycikgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdyZW5hbWUgZmFpbGVkJyBlcnIgaWYgZXJyXG4gICAgICAgICAgICAgICAgY2IgZnJvbSwgdG9cblxuICAgIEBjb3B5OiAoZnJvbSwgdG8sIGNiKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guZGlyKGZyb20pID09IHRvXG4gICAgICAgICAgICB1bnVzZWRGaWxlbmFtZSA9IHJlcXVpcmUgJ3VudXNlZC1maWxlbmFtZSdcbiAgICAgICAgICAgIHVudXNlZEZpbGVuYW1lKGZyb20pLnRoZW4gKGZpbGVOYW1lKSA9PiBcbiAgICAgICAgICAgICAgICBAY29weSBmcm9tLCBmaWxlTmFtZSwgY2JcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyKHRvKVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHRvLCBzbGFzaC5maWxlIGZyb21cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdG8gPSBzbGFzaC5qb2luIHNsYXNoLmRpcih0byksIHNsYXNoLmZpbGUgZnJvbVxuXG4gICAgICAgIGZzLmNvcHkgZnJvbSwgdG8sIChlcnIpIC0+XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdjb3B5IGZhaWxlZCcgZXJyIGlmIGVyclxuICAgICAgICAgICAgY2IgZnJvbSwgdG9cbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBjbHNzICA9IGljb25zLmV4dFtzbGFzaC5leHQgZmlsZV1cbiAgICAgICAgY2xzcyA/PSBpY29ucy5iYXNlW3NsYXNoLmJhc2UoZmlsZSkudG9Mb3dlckNhc2UoKV1cbiAgICAgICAgY2xzcyA/PSAnZmlsZSdcbiAgICAgICAgXCJpY29uICN7Y2xzc31cIlxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQHNwYW46ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgYmFzZSA9IHNsYXNoLmJhc2UgdGV4dFxuICAgICAgICBleHQgID0gc2xhc2guZXh0KHRleHQpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgY2xzcyA9IHZhbGlkKGV4dCkgYW5kICcgJytleHQgb3IgJydcbiAgICAgICAgXG4gICAgICAgIGlmIGJhc2Uuc3RhcnRzV2l0aCAnLicgdGhlbiBjbHNzICs9ICcgZG90ZmlsZSdcbiAgICAgICAgXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgZXh0XG4gICAgICAgICAgICBzcGFuICs9IFwiPHNwYW4gY2xhc3M9J2V4dCBwdW5jdCN7Y2xzc30nPi48L3NwYW4+XCIgKyBcIjxzcGFuIGNsYXNzPSdleHQgdGV4dCN7Y2xzc30nPlwiK2V4dCtcIjwvc3Bhbj5cIlxuICAgICAgICBzcGFuXG4gICAgICAgIFxuICAgIEBjcnVtYlNwYW46IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIFwiPHNwYW4+Lzwvc3Bhbj5cIiBpZiBmaWxlIGluIFsnLycgJyddXG4gICAgICAgIFxuICAgICAgICBzcGFucyA9IFtdXG4gICAgICAgIHNwbGl0ID0gc2xhc2guc3BsaXQgZmlsZVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5zcGxpdC5sZW5ndGgtMV1cbiAgICAgICAgICAgIHMgPSBzcGxpdFtpXVxuICAgICAgICAgICAgc3BhbnMucHVzaCBcIjxkaXYgY2xhc3M9J2lubGluZSBwYXRoJyBpZD0nI3tzcGxpdFswLi5pXS5qb2luICcvJ30nPiN7c308L2Rpdj5cIlxuICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lJyBpZD0nI3tmaWxlfSc+I3tzcGxpdFstMV19PC9kaXY+XCJcbiAgICAgICAgcmV0dXJuIHNwYW5zLmpvaW4gXCI8c3BhbiBjbGFzcz0ncHVuY3QnPi88L3NwYW4+XCJcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../../coffee/tools/file.coffee