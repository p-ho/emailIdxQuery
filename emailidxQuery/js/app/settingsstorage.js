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

function SettingsStorage()
{ }

SettingsStorage.DEFAULT_ES_HOST = 'localhost';
SettingsStorage.DEFAULT_ES_PORT = '9200';
SettingsStorage.DEFAULT_LAYOUT_FORMAT = 'inRows';

SettingsStorage.getEsHost = function ()
{
    return localStorage.esHost ? localStorage.esHost : SettingsStorage.DEFAULT_ES_HOST;
}

SettingsStorage.getEsPort = function ()
{
    return localStorage.esPort ? localStorage.esPort : SettingsStorage.DEFAULT_ES_PORT;
}

SettingsStorage.getLayoutFormat = function ()
{
    return localStorage.layoutFormat ? localStorage.layoutFormat : SettingsStorage.DEFAULT_LAYOUT_FORMAT;
}

SettingsStorage.saveAllSettings = function (settingsData)
{
    $.each(settingsData, function(key, value) {
        localStorage.setItem(key, value);
        Tile.refreshLayoutFormat();
        ElasticAdapter.startClient();
    });
}