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

function doFullTextSearch(searchTerm)
{
    Tile.processSearch(ElasticAdapter.fullTextSearch, searchTerm);
}

function doSettingsDialog()
{
    var settingsTile = new Tile().setSettingsContent(function (success, resultData) {
        Tile.unsuspendTiles();
        if (success)
            SettingsStorage.saveAllSettings(resultData);
    });

    settingsTile.showProminent();
}

function loadEmbeddedHiddenContent()
{
    var jqHiddenContent = $('#hiddenContent');
    DocumentTemplates.loadAllChildren(jqHiddenContent);
    jqHiddenContent.detach();
}

$(document).ready(function() {

    Tile.clearTilesNoAnim();
    loadEmbeddedHiddenContent();
    new Tile().setWelcomeContent().show();
    ElasticAdapter.startClient();
    Tile.refreshLayoutFormat();

    $('#searchForm').submit(function(event) {
        var searchTerm = $('#esFulltextSearchterm').val();
        if (searchTerm != "")
        {
            doFullTextSearch(searchTerm);
        }
        else
        {
            Tile.clearTiles(function () {
                new Tile().setWelcomeContent().show()
            });
        }

        return false;
    });

    $('#settingsLink').click(function() {
        doSettingsDialog();
        return false;
    });

    $('#footerLicensesLink').click(function() {
        Tile.clearTiles(function () {
            new Tile().setStaticTemplateContent('aboutTileContainer').show();
        });
        return false;
    });

    $('#headerTitle').click(function() {
        Tile.clearTiles(function () {
            new Tile().setWelcomeContent().show();
            $('#esFulltextSearchterm').val("");
        });
        return false;
    });

    $('#esFulltextSearchterm').focus();
});