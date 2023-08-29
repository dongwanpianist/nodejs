const router = require('express').Router()
module.exports = router;

let htmlpath = ""
let protocol = ""
let https = false
let hostname = ""
let port = process.env.SERVER_PORT
let basepath = ""
let subpath = ""
let query_url = "" // GET: parsed into request.query
                   // POST: parsed into request.body
let direct_url = false
let same_origin = false
let same_site = false
let cross_site = false
let client_ip = ""
let origin = ""
let referer = ""
// router.port = (setport) => { port = setport; return router; } // outer scope setter

// all entrances
router.use((request, response, next) => {
  request.setEncoding('utf8');
  https = ((request.headers['x-forwarded-proto'] === 'https' || request.headers['x-https'] === 'on'));
  protocol = https ? 'https' : 'http';
  hostname = request.hostname;
  basepath = request.baseUrl;
  subpath = request.path;
  htmlpath = require('path').join(__dirname, '../public_html/', basepath) + '/';
  query_url = request.url.substring(request.url.indexOf('?'));
  if (!request.headers.hasOwnProperty('sec-fetch-site')) { } // if missing, do custom parsing of originalUrl......later.
  switch (request.headers['sec-fetch-site']) { // overwrite all property in case of continued connection
    case "none": direct_url = true; same_origin = same_site = cross_site = false; break;
    case "same-origin": same_origin = true; direct_url = same_site = cross_site = false; break;
    case "same-site": same_site = true; direct_url = same_origin = cross_site = false; break;
    case "cross-site": cross_site = true; direct_url = same_origin = same_site = false; break;
    default: direct_url = same_origin = same_site = cross_site = false;
  }
  client_ip = request.headers['x-forwarded-for']?.split(',').shift() || request.socket?.remoteAddress;
  origin = request.headers['origin'] ? request.headers['origin'] : "unknown";
  if (origin == "null") origin = "unknown";
  referer = request.headers['referer'] ? request.headers['referer'] : "unknown";
  if (request.url.indexOf('?') === -1) query_url = '';
  next();
});

router.route('/form').all((request, response) => {
  //response.redirect(`https://${hostname}${basepath}/form.html${query_url}`);
  //response.end();
  response.sendFile(htmlpath + 'form.html');
});

router.route('/redirect').all((request, response) => {
  response.redirect(`https://${hostname}${basepath}/redirected${query_url}`); // GET/POST -> redirected to GET (that's the rule of redirection!)
  //response.end();
});

// all other route cases // all method(GET/POST)
router.route('*').all((request, response) => {
  if (!https) {
    response.redirect(`https://${hostname}${basepath}${subpath}${query_url}`); // GET/POST -> redirected to GET (that's the rule of redirection!)
  } else {
    response_https(request, response);
    response.end();
  }
});

router.use((request, response) => {
  // any other cases
});

function response_https(request, response) {
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.write(
`Hello, securely and conveniently connecting world!

- Following Node.js modules are used:
    * Express
    * Body-parser

Protocol:
${protocol}

Hostname:
${hostname}

Base path:
${basepath}

Sub path:
${subpath}

URL Queries:
${query_url}

URL Assertion if (request.OriginalUrl === Base path + Sub path + URL Queries) ?
= ${(request.originalUrl === basepath + subpath + query_url)}

Method:
${request.method}

Origin:
[${direct_url ? "V" : " "}] Direct url
[${same_origin ? "V" : " "}] Same origin (exactly same subdomain)
[${same_site ? "V" : " "}] Same site${same_site ? " (from \"" + referer + "\")" : ""}
[${cross_site ? "V" : " "}] Cross site${cross_site ? " (from \"" + (referer != "unknown" ? referer : "Client IP " + client_ip) + "\")" : ""}` +
`${(direct_url + same_origin + same_site + cross_site) == 0 ? "\n[V] Unknown (from \"" + (referer != "unknown" ? referer : "Client IP " + client_ip) + "\")" : ""}

GET Data (URL Queries):
${JSON.stringify(request.query, null, 4)}

POST Data (please visit https://${hostname}${basepath}/form): 
${JSON.stringify(request.body, null, 4)}

Header:
${JSON.stringify(request.headers, Object.keys(request.headers).sort(), 4)
.replace("104.219.248.105", '[the server IP is hidden by ~dev.DWP~]')}

=================
End of output. Thank you!  - dev.DWP`
  );
}