(function () {

    var request;
    if (window.XMLHttpRequest) {
        request = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // IE
        try {
            request = new ActiveXObject('Msxml2.XMLHTTP');
        }
        catch (e) {
            try {
                request = new ActiveXObject('Microsoft.XMLHTTP');
            }
            catch (e) { }
        }
    }

    function polyfill(bundles) {
        // Polyfill and/or monkey patch System.import.
        // Credits go to https://github.com/cramforce/splittable
        (self.System = self.System || {}).import = function (n) {
            if (n.length == 0) return;
            // Always end names in .js
            n = n.replace(/\.js$/g, "") + ".js";
            // Short circuit if the bundle is already loaded.
            return (self._S["//" + n] && Promise.resolve(self._S["//" + n]))
                // Short circuit if we are already loadind, otherwise create
                // a promise (that will short circuit subsequent requests)
                // and start loading.
                ||
                self._S[n] || (self._S[n] = new Promise(function (r, t) {
                    // Load via a script
                    var s = document.createElement("script");
                    // Calculate the source URL using the same algorithms as used
                    // during bundle generation.
                    s.src = (self._S._map[n] ? self._S._map[n].path : self.System.baseURL) + "/" + (self._S._map[n] ? self._S._map[n].filename : n);
                    // Fail promise on any error.
                    s.onerror = t;
                    // On success the trailing module in every bundle will have created
                    // the _S global representing the module object that is the root
                    // of the bundle. Resolve the promise with it.
                    s.onload = function () {
                        r(self._S["//" + n])
                    };
                    // Append the script tag.
                    (document.head || document.documentElement).appendChild(s);
                }))
        }
        // Runs scheduled non-base bundles in the _S array and overrides
        // .push to immediately execute incoming bundles.
        self._S = self._S || [];
        self._S._map = bundles;
        self._S.push = function (f) {
            f.call(self)
        };

    }

    request.open('GET', 'lazy.config.json', true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(null);

    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                polyfill(JSON.parse(request.response).bundles)
            }
        }
    };

})();
