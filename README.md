# emailIdxQuery
**emailIdxQuery** is a web-based front-end for searching in emails synchronized by [emailIdx](https://github.com/p-ho/emailIdx)
to an Elasticsearch-Server.

## Getting started
Using *emailIdxQuery* is as easy as copying everything inside the `emailidxQuery` folder onto a webserver's serving directory.

## Prerequisites
*emailIdxQuery* must perform AJAX-calls in order to read from the Elasticsearch-DB. But as this violates the Same-Origin-Policy ([?](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)) of your browser you need to add a `Access-Control-Allow-Origin`-header to the reponses of your Elasticsearch-server.

That can be achieved by establishing a proxy between the server hosting *emailIdxQuery* and Elasticsearch.
For example one could use Apache's `mod_proxy` capabilities. The resulting vhost-configuration might look like the following one:
```apache
<VirtualHost *:9222>
    ServerName localhost
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyVia Off
    ProxyPass / http://127.0.0.1:9200/
    ProxyPassReverse / http://127.0.0.1:9200/
    Header set Access-Control-Allow-Origin http://localhost

    ErrorLog ${APACHE_LOG_DIR}/elasticproxy_error.log
    CustomLog ${APACHE_LOG_DIR}/elasticproxy_access.log combined
</VirtualHost>
```
That listing assumes Elasticsearch to listen at `http://127.0.0.1:9200/`.

One should also replace `localhost` by the actual server names.

## Configuration
You can configure the address of the ES-Server (the proxy) to pick in the web-frontend.
These settings persist on client side using `localStorage` ([?](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API))
.
