// koffee 1.12.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var Main, app, args, kapp, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), app = ref.app, args = ref.args, post = ref.post;

Main = (function(superClass) {
    extend(Main, superClass);

    function Main() {
        this.onOtherInstance = bind(this.onOtherInstance, this);
        Main.__super__.constructor.call(this, {
            dir: __dirname,
            pkg: require('../package.json'),
            shortcut: 'CmdOrCtrl+Alt+E',
            index: 'index.html',
            icon: '../img/app.ico',
            tray: '../img/menu.png',
            about: '../img/about.png',
            onOtherInstance: this.onOtherInstance,
            prefsSeperator: '▸',
            aboutDebug: false,
            width: 474,
            height: 900,
            minWidth: 353,
            minHeight: 111,
            args: "folder          to open     **"
        });
        post.on('winDidShow', function() {});
        post.on('menuAction', (function(_this) {
            return function(action) {
                switch (action) {
                    case 'New Window':
                        return _this.createWindow();
                }
            };
        })(this));
    }

    Main.prototype.onOtherInstance = function(otherargs, dir) {
        var arg, i, len;
        args.folder = [];
        for (i = 0, len = otherargs.length; i < len; i++) {
            arg = otherargs[i];
            if (arg.endsWith('.exe')) {
                continue;
            }
            if (arg.indexOf('keks.app/Contents/MacOS') > 0) {
                continue;
            }
            if (arg.startsWith('--')) {
                continue;
            }
            args.folder.push(arg);
        }
        if (this.win) {
            post.toWin(this.win.id, 'browse', args.folder[0]);
            return this.win.focus();
        } else {
            return this.showWindow();
        }
    };

    return Main;

})(app);

kapp = new Main;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGdDQUFBO0lBQUE7Ozs7QUFRQSxNQUFzQixPQUFBLENBQVEsS0FBUixDQUF0QixFQUFFLGFBQUYsRUFBTyxlQUFQLEVBQWE7O0FBRVA7OztJQUVDLGNBQUE7O1FBRUMsc0NBQ0k7WUFBQSxHQUFBLEVBQVksU0FBWjtZQUNBLEdBQUEsRUFBWSxPQUFBLENBQVEsaUJBQVIsQ0FEWjtZQUVBLFFBQUEsRUFBWSxpQkFGWjtZQUdBLEtBQUEsRUFBWSxZQUhaO1lBSUEsSUFBQSxFQUFZLGdCQUpaO1lBS0EsSUFBQSxFQUFZLGlCQUxaO1lBTUEsS0FBQSxFQUFZLGtCQU5aO1lBT0EsZUFBQSxFQUFpQixJQUFDLENBQUEsZUFQbEI7WUFRQSxjQUFBLEVBQWdCLEdBUmhCO1lBU0EsVUFBQSxFQUFZLEtBVFo7WUFVQSxLQUFBLEVBQVksR0FWWjtZQVdBLE1BQUEsRUFBWSxHQVhaO1lBWUEsUUFBQSxFQUFZLEdBWlo7WUFhQSxTQUFBLEVBQVksR0FiWjtZQWNBLElBQUEsRUFBTSxnQ0FkTjtTQURKO1FBbUJBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFxQixTQUFBLEdBQUEsQ0FBckI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBcUIsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxNQUFEO0FBQ2pCLHdCQUFPLE1BQVA7QUFBQSx5QkFDUyxZQURUOytCQUMyQixLQUFDLENBQUEsWUFBRCxDQUFBO0FBRDNCO1lBRGlCO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjtJQXRCRDs7bUJBMEJILGVBQUEsR0FBaUIsU0FBQyxTQUFELEVBQVksR0FBWjtBQUdiLFlBQUE7UUFBQSxJQUFJLENBQUMsTUFBTCxHQUFjO0FBQ2QsYUFBQSwyQ0FBQTs7WUFDSSxJQUFHLEdBQUcsQ0FBQyxRQUFKLENBQWEsTUFBYixDQUFIO0FBQTRCLHlCQUE1Qjs7WUFDQSxJQUFHLEdBQUcsQ0FBQyxPQUFKLENBQVkseUJBQVosQ0FBQSxHQUF5QyxDQUE1QztBQUFtRCx5QkFBbkQ7O1lBQ0EsSUFBRyxHQUFHLENBQUMsVUFBSixDQUFlLElBQWYsQ0FBSDtBQUE0Qix5QkFBNUI7O1lBQ0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFaLENBQWlCLEdBQWpCO0FBSko7UUFNQSxJQUFHLElBQUMsQ0FBQSxHQUFKO1lBQ0ksSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFDLENBQUEsR0FBRyxDQUFDLEVBQWhCLEVBQW9CLFFBQXBCLEVBQTZCLElBQUksQ0FBQyxNQUFPLENBQUEsQ0FBQSxDQUF6QzttQkFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUwsQ0FBQSxFQUZKO1NBQUEsTUFBQTttQkFJSSxJQUFDLENBQUEsVUFBRCxDQUFBLEVBSko7O0lBVmE7Ozs7R0E1QkY7O0FBNENuQixJQUFBLEdBQU8sSUFBSSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IGFwcCwgYXJncywgcG9zdCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBNYWluIGV4dGVuZHMgYXBwXG5cbiAgICBAOiAtPlxuXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBkaXI6ICAgICAgICBfX2Rpcm5hbWVcbiAgICAgICAgICAgIHBrZzogICAgICAgIHJlcXVpcmUgJy4uL3BhY2thZ2UuanNvbidcbiAgICAgICAgICAgIHNob3J0Y3V0OiAgICdDbWRPckN0cmwrQWx0K0UnXG4gICAgICAgICAgICBpbmRleDogICAgICAnaW5kZXguaHRtbCdcbiAgICAgICAgICAgIGljb246ICAgICAgICcuLi9pbWcvYXBwLmljbydcbiAgICAgICAgICAgIHRyYXk6ICAgICAgICcuLi9pbWcvbWVudS5wbmcnXG4gICAgICAgICAgICBhYm91dDogICAgICAnLi4vaW1nL2Fib3V0LnBuZydcbiAgICAgICAgICAgIG9uT3RoZXJJbnN0YW5jZTogQG9uT3RoZXJJbnN0YW5jZVxuICAgICAgICAgICAgcHJlZnNTZXBlcmF0b3I6ICfilrgnXG4gICAgICAgICAgICBhYm91dERlYnVnOiBmYWxzZVxuICAgICAgICAgICAgd2lkdGg6ICAgICAgNDc0XG4gICAgICAgICAgICBoZWlnaHQ6ICAgICA5MDBcbiAgICAgICAgICAgIG1pbldpZHRoOiAgIDM1M1xuICAgICAgICAgICAgbWluSGVpZ2h0OiAgMTExXG4gICAgICAgICAgICBhcmdzOiBcIlwiXCJcbiAgICAgICAgICAgICAgICAgICAgZm9sZGVyICAgICAgICAgIHRvIG9wZW4gICAgICoqXG4gICAgICAgICAgICBcIlwiXCJcbiAgICBcbiAgICAgICAgcG9zdC5vbiAnd2luRGlkU2hvdycgLT5cbiAgICAgICAgcG9zdC5vbiAnbWVudUFjdGlvbicgKGFjdGlvbikgPT5cbiAgICAgICAgICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgICAgICAgICB3aGVuICdOZXcgV2luZG93JyB0aGVuIEBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgICAgIFxuICAgIG9uT3RoZXJJbnN0YW5jZTogKG90aGVyYXJncywgZGlyKSA9PlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdvbk90aGVySW5zdGFuY2UnIG90aGVyYXJncywgZGlyXG4gICAgICAgIGFyZ3MuZm9sZGVyID0gW11cbiAgICAgICAgZm9yIGFyZyBpbiBvdGhlcmFyZ3NcbiAgICAgICAgICAgIGlmIGFyZy5lbmRzV2l0aCAnLmV4ZScgdGhlbiBjb250aW51ZVxuICAgICAgICAgICAgaWYgYXJnLmluZGV4T2YoJ2tla3MuYXBwL0NvbnRlbnRzL01hY09TJykgPiAwIHRoZW4gY29udGludWVcbiAgICAgICAgICAgIGlmIGFyZy5zdGFydHNXaXRoICctLScgdGhlbiBjb250aW51ZVxuICAgICAgICAgICAgYXJncy5mb2xkZXIucHVzaCBhcmdcbiAgICAgICAgXG4gICAgICAgIGlmIEB3aW5cbiAgICAgICAgICAgIHBvc3QudG9XaW4gQHdpbi5pZCwgJ2Jyb3dzZScgYXJncy5mb2xkZXJbMF1cbiAgICAgICAgICAgIEB3aW4uZm9jdXMoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2hvd1dpbmRvdygpXG4gICAgICAgICAgICBcbmthcHAgPSBuZXcgTWFpbiJdfQ==
//# sourceURL=../coffee/main.coffee