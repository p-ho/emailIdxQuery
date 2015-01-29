//
//    emailIdxQuery - A front-end for searching in emails synchronized by emailIdx
//    Copyright (C) 2015 Paul Hofmann
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

function ElasticAdapter ()
{ }

ElasticAdapter.TYPE_EMAIL = 'email';
ElasticAdapter.INDEX_EMAILS = 'emails';

ElasticAdapter.startClient = function ()
{
    var esHost = SettingsStorage.getEsHost();
    var esPort = SettingsStorage.getEsPort();
    var esHosts = esHost + ":" + esPort;

    ElasticAdapter.client = new $.es.Client({
        hosts: esHosts
    });
}


ElasticAdapter.ping = function (pingCallback)
{
    ElasticAdapter.client.ping({
        requestTimeout: 1000,
    }, function (error) {
        if (error) {
            pingCallback(false);
        } else {
            pingCallback(true);
        }
    });
}

ElasticAdapter.genericSearch = function (searchObject, searchCallback, infoBundle)
{   
    var actualSearchObject = $.extend({index: ElasticAdapter.INDEX_EMAILS, type: ElasticAdapter.TYPE_EMAIL,}, searchObject);

    ElasticAdapter.client.search(actualSearchObject).then(function (body) {
        var hits = body.hits.hits;
        var messages = {};

        $.each(hits, function(index, hit) {
            var contentSelector = '_source' in hit ? '_source' : 'fields';
            var currEmail = hit[contentSelector];
            currEmail.__proto__ = EMailPrototype;
            messages[hit['_id']] = currEmail;
        });

        searchCallback(messages, infoBundle);

    }, function (error) {
        console.error('Error during search request.');
        searchCallback(null, infoBundle);
    });
}

ElasticAdapter.fullTextSearch = function (searchTerm, searchCallback, infoBundle)
{
    ElasticAdapter.genericSearch({q: searchTerm}, searchCallback, infoBundle);
}

ElasticAdapter.searchByMessageId = function (msgId, searchCallback, infoBundle)
{
    var filterQuery =  {
        body : {
            query : {
                filtered : { 
                    query : {
                        match_all : {} 
                    },
                    filter : {
                        term : { 
                            msg_id: msgId
                        }
                    }
                }
            }
        }
    };

    ElasticAdapter.genericSearch(filterQuery, searchCallback, infoBundle);
}

ElasticAdapter.searchMessagesReferencing = function (msgId, searchCallback, infoBundle)
{
    var filterQuery =  {
        body : {
            query : {
                filtered : { 
                    query : {
                        match_all : {} 
                    },
                    filter : {
                        term : { 
                            references: msgId
                        }
                    }
                }
            }
        }
    };

    if (infoBundle.esNoContent)
    {
        filterQuery.body.fields = ['hash', 'mailbox', 'msg_id', 'references'];
    }

    ElasticAdapter.genericSearch(filterQuery, searchCallback, infoBundle);
}


