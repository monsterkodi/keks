// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, ref, slash, valid;

ref = require('kxk'), slash = ref.slash, valid = ref.valid;

File = (function() {
    function File() {}

    File.iconClassName = function(file) {
        var className, err, fileIcons;
        switch (slash.ext(file)) {
            case 'noon':
                className = 'noon-icon';
                break;
            case 'koffee':
                className = 'coffee-icon';
                break;
            case 'xcf':
                className = 'gimp-icon';
                break;
            default:
                try {
                    fileIcons = require('file-icons-js');
                    className = fileIcons.getClass(file);
                } catch (error) {
                    err = error;
                    true;
                }
        }
        if (className != null) {
            className;
        } else {
            className = 'file-icon';
        }
        return className;
    };

    File.span = function(text) {
        var base, clss, ext, span;
        base = slash.base(text);
        ext = slash.ext(text).toLowerCase();
        clss = valid(ext) && ' ' + ext || '';
        span = ("<span class='text" + clss + "'>") + base + "</span>";
        if (valid(ext)) {
            span += ("<span class='ext punct" + clss + "'>.</span>") + ("<span class='ext text" + clss + "'>") + ext + "</span>";
        }
        return span;
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBbUIsT0FBQSxDQUFRLEtBQVIsQ0FBbkIsRUFBRSxpQkFBRixFQUFTOztBQUVIOzs7SUFRRixJQUFDLENBQUEsYUFBRCxHQUFnQixTQUFDLElBQUQ7QUFFWixZQUFBO0FBQUEsZ0JBQU8sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQVA7QUFBQSxpQkFDUyxNQURUO2dCQUN1QixTQUFBLEdBQVk7QUFBMUI7QUFEVCxpQkFFUyxRQUZUO2dCQUV1QixTQUFBLEdBQVk7QUFBMUI7QUFGVCxpQkFHUyxLQUhUO2dCQUd1QixTQUFBLEdBQVk7QUFBMUI7QUFIVDtBQUtRO29CQUNJLFNBQUEsR0FBWSxPQUFBLENBQVEsZUFBUjtvQkFDWixTQUFBLEdBQVksU0FBUyxDQUFDLFFBQVYsQ0FBbUIsSUFBbkIsRUFGaEI7aUJBQUEsYUFBQTtvQkFHTTtvQkFDRixLQUpKOztBQUxSOztZQVVBOztZQUFBLFlBQWE7O2VBQ2I7SUFiWTs7SUFxQmhCLElBQUMsQ0FBQSxJQUFELEdBQU8sU0FBQyxJQUFEO0FBRUgsWUFBQTtRQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLElBQVg7UUFDUCxHQUFBLEdBQU8sS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQWUsQ0FBQyxXQUFoQixDQUFBO1FBQ1AsSUFBQSxHQUFPLEtBQUEsQ0FBTSxHQUFOLENBQUEsSUFBZSxHQUFBLEdBQUksR0FBbkIsSUFBMEI7UUFDakMsSUFBQSxHQUFPLENBQUEsbUJBQUEsR0FBb0IsSUFBcEIsR0FBeUIsSUFBekIsQ0FBQSxHQUE2QixJQUE3QixHQUFrQztRQUN6QyxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7WUFDSSxJQUFBLElBQVEsQ0FBQSx3QkFBQSxHQUF5QixJQUF6QixHQUE4QixZQUE5QixDQUFBLEdBQTRDLENBQUEsdUJBQUEsR0FBd0IsSUFBeEIsR0FBNkIsSUFBN0IsQ0FBNUMsR0FBNkUsR0FBN0UsR0FBaUYsVUFEN0Y7O2VBRUE7SUFSRzs7Ozs7O0FBVVgsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuIyMjXG5cbnsgc2xhc2gsIHZhbGlkIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEZpbGVcbiAgICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAaWNvbkNsYXNzTmFtZTogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggc2xhc2guZXh0IGZpbGVcbiAgICAgICAgICAgIHdoZW4gJ25vb24nICAgdGhlbiBjbGFzc05hbWUgPSAnbm9vbi1pY29uJ1xuICAgICAgICAgICAgd2hlbiAna29mZmVlJyB0aGVuIGNsYXNzTmFtZSA9ICdjb2ZmZWUtaWNvbidcbiAgICAgICAgICAgIHdoZW4gJ3hjZicgICAgdGhlbiBjbGFzc05hbWUgPSAnZ2ltcC1pY29uJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgICAgICBmaWxlSWNvbnMgPSByZXF1aXJlICdmaWxlLWljb25zLWpzJ1xuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUgPSBmaWxlSWNvbnMuZ2V0Q2xhc3MgZmlsZVxuICAgICAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgIGNsYXNzTmFtZSA/PSAnZmlsZS1pY29uJ1xuICAgICAgICBjbGFzc05hbWVcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIEBzcGFuOiAodGV4dCkgLT5cbiAgICAgICAgXG4gICAgICAgIGJhc2UgPSBzbGFzaC5iYXNlIHRleHRcbiAgICAgICAgZXh0ICA9IHNsYXNoLmV4dCh0ZXh0KS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGNsc3MgPSB2YWxpZChleHQpIGFuZCAnICcrZXh0IG9yICcnXG4gICAgICAgIHNwYW4gPSBcIjxzcGFuIGNsYXNzPSd0ZXh0I3tjbHNzfSc+XCIrYmFzZStcIjwvc3Bhbj5cIlxuICAgICAgICBpZiB2YWxpZCBleHRcbiAgICAgICAgICAgIHNwYW4gKz0gXCI8c3BhbiBjbGFzcz0nZXh0IHB1bmN0I3tjbHNzfSc+Ljwvc3Bhbj5cIiArIFwiPHNwYW4gY2xhc3M9J2V4dCB0ZXh0I3tjbHNzfSc+XCIrZXh0K1wiPC9zcGFuPlwiXG4gICAgICAgIHNwYW5cbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../coffee/file.coffee