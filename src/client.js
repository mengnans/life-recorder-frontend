import rest from 'rest'
import defaultRequest from 'rest/interceptor/defaultRequest'
import mime from 'rest/interceptor/mime'
import errorCode from 'rest/interceptor/errorCode'
import baseRegistry from 'rest/mime/registry'
import interceptor from 'rest/interceptor'
import hal from 'rest/mime/type/application/hal'

let registry = baseRegistry.child();

registry.register('text/uri-list', () => {
    /* Convert a single or array of resources into "URI1\nURI2\nURI3..." */
    return {
        read: function(str /*, opts */) {
            return str.split('\n');
        },
        write: function(obj /*, opts */) {
            // If this is an Array, extract the self URI and then join using a newline
            if (obj instanceof Array) {
                return obj.map(function(resource) {
                    return resource._links.self.href;
                }).join('\n');
            } else { // otherwise, just return the self URI
                return obj._links.self.href;
            }
        }
    };
});

registry.register('application/hal+json', hal);

let myIncerceptor = interceptor({
    request: function (request /*, config, meta */) {
        /* If the URI is a URI Template per RFC 6570 (http://tools.ietf.org/html/rfc6570), trim out the template part */
        if (request.path.indexOf('{') === -1) {
            return request;
        } else {
            request.path = request.path.split('{')[0];
            return request;
        }
    }
});
export default rest
    .wrap(mime, { registry: registry })
    .wrap(myIncerceptor)
    .wrap(errorCode)
    .wrap(defaultRequest, { headers: { 'Accept': 'application/hal+json' }});