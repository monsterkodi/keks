// koffee 1.4.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var app, args, kapp, klog, post, ref;

ref = require('kxk'), post = ref.post, app = ref.app, args = ref.args, post = ref.post, klog = ref.klog;

kapp = new app({
    dir: __dirname,
    pkg: require('../package.json'),
    shortcut: 'CmdOrCtrl+Alt+E',
    index: 'index.html',
    icon: '../img/app.ico',
    tray: '../img/menu.png',
    about: '../img/about.png',
    prefsSeperator: '▸',
    aboutDebug: false,
    width: 474,
    height: 900,
    minWidth: 353,
    minHeight: 111,
    args: "folder          to open     **"
});

post.on('winDidShow', function() {});

post.on('menuAction', function(action) {
    switch (action) {
        case 'New Window':
            return kapp.createWindow();
    }
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBa0MsT0FBQSxDQUFRLEtBQVIsQ0FBbEMsRUFBRSxlQUFGLEVBQVEsYUFBUixFQUFhLGVBQWIsRUFBbUIsZUFBbkIsRUFBeUI7O0FBRXpCLElBQUEsR0FBTyxJQUFJLEdBQUosQ0FDSDtJQUFBLEdBQUEsRUFBWSxTQUFaO0lBQ0EsR0FBQSxFQUFZLE9BQUEsQ0FBUSxpQkFBUixDQURaO0lBRUEsUUFBQSxFQUFZLGlCQUZaO0lBR0EsS0FBQSxFQUFZLFlBSFo7SUFJQSxJQUFBLEVBQVksZ0JBSlo7SUFLQSxJQUFBLEVBQVksaUJBTFo7SUFNQSxLQUFBLEVBQVksa0JBTlo7SUFPQSxjQUFBLEVBQWdCLEdBUGhCO0lBUUEsVUFBQSxFQUFZLEtBUlo7SUFTQSxLQUFBLEVBQVksR0FUWjtJQVVBLE1BQUEsRUFBWSxHQVZaO0lBV0EsUUFBQSxFQUFZLEdBWFo7SUFZQSxTQUFBLEVBQVksR0FaWjtJQWFBLElBQUEsRUFBTSxnQ0FiTjtDQURHOztBQWtCUCxJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBcUIsU0FBQSxHQUFBLENBQXJCOztBQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFxQixTQUFDLE1BQUQ7QUFFakIsWUFBTyxNQUFQO0FBQUEsYUFDUyxZQURUO21CQUMyQixJQUFJLENBQUMsWUFBTCxDQUFBO0FBRDNCO0FBRmlCLENBQXJCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgYXBwLCBhcmdzLCBwb3N0LCBrbG9nIH0gPSByZXF1aXJlICdreGsnXG5cbmthcHAgPSBuZXcgYXBwXG4gICAgZGlyOiAgICAgICAgX19kaXJuYW1lXG4gICAgcGtnOiAgICAgICAgcmVxdWlyZSAnLi4vcGFja2FnZS5qc29uJ1xuICAgIHNob3J0Y3V0OiAgICdDbWRPckN0cmwrQWx0K0UnXG4gICAgaW5kZXg6ICAgICAgJ2luZGV4Lmh0bWwnXG4gICAgaWNvbjogICAgICAgJy4uL2ltZy9hcHAuaWNvJ1xuICAgIHRyYXk6ICAgICAgICcuLi9pbWcvbWVudS5wbmcnXG4gICAgYWJvdXQ6ICAgICAgJy4uL2ltZy9hYm91dC5wbmcnXG4gICAgcHJlZnNTZXBlcmF0b3I6ICfilrgnXG4gICAgYWJvdXREZWJ1ZzogZmFsc2VcbiAgICB3aWR0aDogICAgICA0NzRcbiAgICBoZWlnaHQ6ICAgICA5MDBcbiAgICBtaW5XaWR0aDogICAzNTNcbiAgICBtaW5IZWlnaHQ6ICAxMTFcbiAgICBhcmdzOiBcIlwiXCJcbiAgICAgICAgICAgIGZvbGRlciAgICAgICAgICB0byBvcGVuICAgICAqKlxuICAgIFwiXCJcIlxuICAgIFxucG9zdC5vbiAnd2luRGlkU2hvdycgLT5cbnBvc3Qub24gJ21lbnVBY3Rpb24nIChhY3Rpb24pIC0+XG4gICAgXG4gICAgc3dpdGNoIGFjdGlvblxuICAgICAgICB3aGVuICdOZXcgV2luZG93JyB0aGVuIGthcHAuY3JlYXRlV2luZG93KClcbiAgICAgICAgIyBlbHNlICAgICBcbiAgICAgICAgICAgICMga2xvZyAnbWVudUFjdGlvbicgYWN0aW9uXG4gICAgICAgICAgICAiXX0=
//# sourceURL=../coffee/main.coffee