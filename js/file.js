// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, slash;

slash = require('kxk').slash;

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
                className = 'image-icon';
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

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUUsUUFBVSxPQUFBLENBQVEsS0FBUjs7QUFFTjs7O0lBRUYsSUFBQyxDQUFBLGFBQUQsR0FBZ0IsU0FBQyxJQUFEO0FBRVosWUFBQTtBQUFBLGdCQUFPLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFQO0FBQUEsaUJBQ1MsTUFEVDtnQkFDdUIsU0FBQSxHQUFZO0FBQTFCO0FBRFQsaUJBRVMsUUFGVDtnQkFFdUIsU0FBQSxHQUFZO0FBQTFCO0FBRlQsaUJBR1MsS0FIVDtnQkFHdUIsU0FBQSxHQUFZO0FBQTFCO0FBSFQ7QUFLUTtvQkFDSSxTQUFBLEdBQVksT0FBQSxDQUFRLGVBQVI7b0JBQ1osU0FBQSxHQUFZLFNBQVMsQ0FBQyxRQUFWLENBQW1CLElBQW5CLEVBRmhCO2lCQUFBLGFBQUE7b0JBR007b0JBQ0YsS0FKSjs7QUFMUjs7WUFVQTs7WUFBQSxZQUFhOztlQUNiO0lBYlk7Ozs7OztBQWVwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBGaWxlXG4gICAgXG4gICAgQGljb25DbGFzc05hbWU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIHNsYXNoLmV4dCBmaWxlXG4gICAgICAgICAgICB3aGVuICdub29uJyAgIHRoZW4gY2xhc3NOYW1lID0gJ25vb24taWNvbidcbiAgICAgICAgICAgIHdoZW4gJ2tvZmZlZScgdGhlbiBjbGFzc05hbWUgPSAnY29mZmVlLWljb24nXG4gICAgICAgICAgICB3aGVuICd4Y2YnICAgIHRoZW4gY2xhc3NOYW1lID0gJ2ltYWdlLWljb24nXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgICAgIGZpbGVJY29ucyA9IHJlcXVpcmUgJ2ZpbGUtaWNvbnMtanMnXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSA9IGZpbGVJY29ucy5nZXRDbGFzcyBmaWxlXG4gICAgICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgICAgIHRydWVcbiAgICAgICAgY2xhc3NOYW1lID89ICdmaWxlLWljb24nXG4gICAgICAgIGNsYXNzTmFtZVxuICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVcbiJdfQ==
//# sourceURL=../coffee/file.coffee