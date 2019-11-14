// koffee 1.4.0

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

ref = require('kxk'), post = ref.post, args = ref.args, app = ref.app;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0NBQUE7SUFBQTs7OztBQVFBLE1BQXNCLE9BQUEsQ0FBUSxLQUFSLENBQXRCLEVBQUUsZUFBRixFQUFRLGVBQVIsRUFBYzs7QUFFUjs7O0lBRUMsY0FBQTs7UUFFQyxzQ0FDSTtZQUFBLEdBQUEsRUFBWSxTQUFaO1lBQ0EsR0FBQSxFQUFZLE9BQUEsQ0FBUSxpQkFBUixDQURaO1lBRUEsUUFBQSxFQUFZLGlCQUZaO1lBR0EsS0FBQSxFQUFZLFlBSFo7WUFJQSxJQUFBLEVBQVksZ0JBSlo7WUFLQSxJQUFBLEVBQVksaUJBTFo7WUFNQSxLQUFBLEVBQVksa0JBTlo7WUFPQSxlQUFBLEVBQWlCLElBQUMsQ0FBQSxlQVBsQjtZQVFBLGNBQUEsRUFBZ0IsR0FSaEI7WUFTQSxVQUFBLEVBQVksS0FUWjtZQVVBLEtBQUEsRUFBWSxHQVZaO1lBV0EsTUFBQSxFQUFZLEdBWFo7WUFZQSxRQUFBLEVBQVksR0FaWjtZQWFBLFNBQUEsRUFBWSxHQWJaO1lBY0EsSUFBQSxFQUFNLGdDQWROO1NBREo7UUFtQkEsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXFCLFNBQUEsR0FBQSxDQUFyQjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFxQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLE1BQUQ7QUFDakIsd0JBQU8sTUFBUDtBQUFBLHlCQUNTLFlBRFQ7K0JBQzJCLEtBQUMsQ0FBQSxZQUFELENBQUE7QUFEM0I7WUFEaUI7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJCO0lBdEJEOzttQkEwQkgsZUFBQSxHQUFpQixTQUFDLFNBQUQsRUFBWSxHQUFaO0FBRWIsWUFBQTtRQUFBLElBQUksQ0FBQyxNQUFMLEdBQWM7QUFDZCxhQUFBLDJDQUFBOztZQUNJLElBQUcsR0FBRyxDQUFDLFFBQUosQ0FBYSxNQUFiLENBQUg7QUFBNEIseUJBQTVCOztZQUNBLElBQUcsR0FBRyxDQUFDLFVBQUosQ0FBZSxJQUFmLENBQUg7QUFBNEIseUJBQTVCOztZQUNBLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBWixDQUFpQixHQUFqQjtBQUhKO1FBS0EsSUFBRyxJQUFDLENBQUEsR0FBSjtZQUNJLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBQyxDQUFBLEdBQUcsQ0FBQyxFQUFoQixFQUFvQixRQUFwQixFQUE2QixJQUFJLENBQUMsTUFBTyxDQUFBLENBQUEsQ0FBekM7bUJBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFMLENBQUEsRUFGSjtTQUFBLE1BQUE7bUJBSUksSUFBQyxDQUFBLFVBQUQsQ0FBQSxFQUpKOztJQVJhOzs7O0dBNUJGOztBQTBDbkIsSUFBQSxHQUFPLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBhcmdzLCBhcHAgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgTWFpbiBleHRlbmRzIGFwcFxuXG4gICAgQDogLT5cblxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBwa2c6ICAgICAgICByZXF1aXJlICcuLi9wYWNrYWdlLmpzb24nXG4gICAgICAgICAgICBzaG9ydGN1dDogICAnQ21kT3JDdHJsK0FsdCtFJ1xuICAgICAgICAgICAgaW5kZXg6ICAgICAgJ2luZGV4Lmh0bWwnXG4gICAgICAgICAgICBpY29uOiAgICAgICAnLi4vaW1nL2FwcC5pY28nXG4gICAgICAgICAgICB0cmF5OiAgICAgICAnLi4vaW1nL21lbnUucG5nJ1xuICAgICAgICAgICAgYWJvdXQ6ICAgICAgJy4uL2ltZy9hYm91dC5wbmcnXG4gICAgICAgICAgICBvbk90aGVySW5zdGFuY2U6IEBvbk90aGVySW5zdGFuY2VcbiAgICAgICAgICAgIHByZWZzU2VwZXJhdG9yOiAn4pa4J1xuICAgICAgICAgICAgYWJvdXREZWJ1ZzogZmFsc2VcbiAgICAgICAgICAgIHdpZHRoOiAgICAgIDQ3NFxuICAgICAgICAgICAgaGVpZ2h0OiAgICAgOTAwXG4gICAgICAgICAgICBtaW5XaWR0aDogICAzNTNcbiAgICAgICAgICAgIG1pbkhlaWdodDogIDExMVxuICAgICAgICAgICAgYXJnczogXCJcIlwiXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlciAgICAgICAgICB0byBvcGVuICAgICAqKlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgXG4gICAgICAgIHBvc3Qub24gJ3dpbkRpZFNob3cnIC0+XG4gICAgICAgIHBvc3Qub24gJ21lbnVBY3Rpb24nIChhY3Rpb24pID0+XG4gICAgICAgICAgICBzd2l0Y2ggYWN0aW9uXG4gICAgICAgICAgICAgICAgd2hlbiAnTmV3IFdpbmRvdycgdGhlbiBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgICAgICBcbiAgICBvbk90aGVySW5zdGFuY2U6IChvdGhlcmFyZ3MsIGRpcikgPT5cbiAgICAgICAgXG4gICAgICAgIGFyZ3MuZm9sZGVyID0gW11cbiAgICAgICAgZm9yIGFyZyBpbiBvdGhlcmFyZ3NcbiAgICAgICAgICAgIGlmIGFyZy5lbmRzV2l0aCAnLmV4ZScgdGhlbiBjb250aW51ZVxuICAgICAgICAgICAgaWYgYXJnLnN0YXJ0c1dpdGggJy0tJyB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICBhcmdzLmZvbGRlci5wdXNoIGFyZ1xuICAgICAgICBcbiAgICAgICAgaWYgQHdpblxuICAgICAgICAgICAgcG9zdC50b1dpbiBAd2luLmlkLCAnYnJvd3NlJyBhcmdzLmZvbGRlclswXVxuICAgICAgICAgICAgQHdpbi5mb2N1cygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaG93V2luZG93KClcbiAgICAgICAgICAgIFxua2FwcCA9IG5ldyBNYWluIl19
//# sourceURL=../coffee/main.coffee