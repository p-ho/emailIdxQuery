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

function Tile ()
{
    this.content = null;
}

Tile.TILES_DIV_ID = 'tilesDiv';
Tile.TILE_CSS_CLASS = 'basicTile';
Tile.TILE_HEADERS_TO_DISPLAY = ['Subject', 'From', 'To', 'CC', 'BCC'];

Tile.suspendedTiles = null;
Tile.theSuspendingTile = null;

////////////////// HELPER FUNCTIONS //////////////////

Tile.prototype.setHTMLContent = function (htmlContent)
{
    this.content = document.createElement('div');
    $(this.content).addClass(Tile.TILE_CSS_CLASS).html(htmlContent);
    return this;
}


Tile.prototype.setStaticTemplateContent = function (templateId)
{
    var rootDiv = $(DocumentTemplates.getByTemplateId(templateId));
    return this.setHTMLContent(rootDiv);
}


Tile.gatherSettingsData = function (jqSettingsForm)
{
    var esHost = jqSettingsForm.find('#esHost').val();
    var esPort = jqSettingsForm.find('#esPort').val();
    var layoutFormat = jqSettingsForm.find('input[name="layoutFormat"]:checked').val();

    var resultData = {
        esHost: esHost,
        esPort: esPort,
        layoutFormat: layoutFormat
    };

    return resultData;
}

////////////////// CONTENT FUNCTIONS //////////////////

Tile.prototype.setEmailContent = function (emailId, email)
{   
    var rootDiv = $(DocumentTemplates.getByTemplateId('emailContainer')).attr('data-emailid', emailId);

    //
    // Message-ID & Mailbox
    //
    rootDiv.find('.tileEmailMsgId').text(email.getMessageId());
    rootDiv.find('.tileEmailMailbox').text(email.mailbox);

    //
    // Header
    //
    var headerDiv = rootDiv.find('.tileEmailHeader');
    $.each(Tile.TILE_HEADERS_TO_DISPLAY, function(idx, headerName) {
        var headerVal = email.getMessage().getHeader(headerName, null);
        if (headerVal != null)
        {
            var headerEle = Tile.getKeyValueAsHTML(headerName, headerVal);
            headerDiv.append(headerEle);
        }
    });

    //
    // Content
    //
    var contentDiv = rootDiv.find('.tileEmailContent');
    var allMsgs = email.getAllMessages();
    $.each(allMsgs, function(idx, msg) {

        if (msg.hasContent())
        {
            var msgContainer = $(DocumentTemplates.getByTemplateId('emailSingleContentContainer'));

            // Filename
            var msgFilename = msg.getFileName();
            if (msgFilename != null)
                msgContainer.find('.emailSingleContentName').text(msgFilename);

            // Download button
            msgContainer.find('.emailSingleContentDownload').click(function() {
                var theUrl = msg.getContentAsDataUrl();
                window.open(theUrl, '_blank');
            });


            // Actual content
            var contentContainer = msgContainer.find('.emailSingleContentContent');
            var textContentPara = msgContainer.find('.emailSingleContentContentText');
            var contentFadeOutArea = msgContainer.find('.emailSingleContentContentFadeOut');
            var displayContent = msg.getContentToDisplayInRows();
            if (displayContent != null)
            {
                $.each(displayContent, function(idx, contentLine) {
                    textContentPara.append(document.createTextNode(contentLine));
                    textContentPara.append(document.createElement('br'));
                });
            }
            else
            {
                contentContainer.css('display', 'none');
            }

            // Content expander
            contentFadeOutArea.click(function() {
                $(this).closest('.emailSingleContentContent').toggleClass('collapsed', 500);
                $(this).toggleClass('collapsed', 500);

                var expanderIco = $(this).find('.emailSingleContentContentFadeOutImage');
                if ($(this).hasClass('collapsed'))
                    expanderIco.attr('src', 'img/ico_expandarrow_down.svg');
                else
                    expanderIco.attr('src', 'img/ico_expandarrow_up.svg');
            });

            contentDiv.append(msgContainer);
        }
    });

    // Expander for entire content
    var expanderImg = rootDiv.find('.tileEmailContentExpanderImage');
    expanderImg.click(function(){
        var emlContainer = $(this).closest('.emailContainer');
        var emlContent = emlContainer.find('.tileEmailContent')
        emlContent.toggleClass('collapsed');


        if(emlContent.hasClass('collapsed'))
        {
            emlContent.hide(500);
            $(this).attr('src', 'img/ico_expandarrow_down.svg');
        }
        else
        {
            emlContent.show(500);
            $(this).attr('src', 'img/ico_expandarrow_up.svg');
        }
    });

    //
    // References
    //
    var refsListDiv = rootDiv.find('.tileEmailDoesReferenceList');
    // Does reference
    var refsListUl = $(document.createElement('ul')).addClass('msgReferenceList');
    refsListDiv.append(refsListUl);
    if (email.references.length > 0)
    {
        $.each(email.references, function(idx, reference) {
            var currRefEntry = $(document.createElement('li')).addClass('msgReferenceListItem')
            .attr('data-reference', reference).text(reference);
            currRefEntry.click(function() {
                var ref = $(this).attr('data-reference');
                Tile.processSearch(ElasticAdapter.searchByMessageId, ref);
            });
            refsListUl.append(currRefEntry);
        });
    }
    else
    {
        refsListUl.append($(document.createElement('li'))
                          .addClass('msgReferenceListItem').addClass('empty').text("(none)"));
    }
    // Is referenced by
    ElasticAdapter.searchMessagesReferencing(email.getMessageId(), function (msgs, infoBundle) {

        var refsListUl = $(document.createElement('ul')).addClass('msgReferenceList');
        infoBundle.refedByListDiv.append(refsListUl);
        if ((msgs != null) && (Object.keys(msgs).length > 0))
        {
            $.each(msgs, function(id, msg) {

                var currRefEntry = $(document.createElement('li')).addClass('msgReferenceListItem')
                .attr('data-reference', msg.getMessageId()).text(msg.getMessageId());
                currRefEntry.click(function() {
                    var ref = $(this).attr('data-reference');
                    Tile.processSearch(ElasticAdapter.searchByMessageId, ref);
                });
                refsListUl.append(currRefEntry);
            });
        }
        else
        {
            var emptyText = "(none)";
            if (msgs == null)
                emptyText = "[ERROR]";
            refsListUl.append($(document.createElement('li'))
                              .addClass('msgReferenceListItem').addClass('empty').text(emptyText));
        }

        infoBundle.refedByListDiv.find('.tileEmailIsReferencedListLoading').detach();

    },{ refedByListDiv: rootDiv.find('.tileEmailIsReferencedList'), esNoContent: true });
    // Ref expander
    var refExpImg = rootDiv.find('.tileEmailReferencesLinkImage');
    refExpImg.click(function(){
        var refRootDiv = $(this).closest('.tileEmailReferences');
        var refsListDiv = refRootDiv.find('.tileEmailReferencesList');
        refsListDiv.toggleClass('collapsed');
        if (refsListDiv.hasClass('collapsed'))
            refsListDiv.hide(500);
        else
            refsListDiv.show(500);
    });

    return this.setHTMLContent(rootDiv);
}


Tile.prototype.setErrorContent = function (errorMsg)
{
    var rootDiv = $(DocumentTemplates.getByTemplateId('tileErrorContainer'));
    rootDiv.find('.tileErrorMessage').text(errorMsg);
    return this.setHTMLContent(rootDiv);
}

Tile.prototype.setSettingsContent = function (resultCallback)
{ 
    var rootForm = $(DocumentTemplates.getByTemplateId('settingsForm'));

    var btnOk = rootForm.find('#btnSettingsOk');
    btnOk.click( function() {
        var theSettingsForm = $(this).closest('#settingsForm');
        resultCallback(true, Tile.gatherSettingsData(theSettingsForm));
    });

    var btnCancel = rootForm.find('#btnSettingsCancel');
    btnCancel.click( function() {
        resultCallback(false, null);
    }); 

    rootForm.find('#esHost').val(SettingsStorage.getEsHost());
    rootForm.find('#esPort').val(SettingsStorage.getEsPort());
    rootForm.find('input[name="layoutFormat"][value="' + SettingsStorage.getLayoutFormat() + '"]').attr('checked', 'checked');

    return this.setHTMLContent(rootForm);
}


Tile.prototype.setWelcomeContent = function ()
{
    this.setStaticTemplateContent('tileWelcomeContainer');

    $(this.content).find('.tileWelcomeSettingsLink').click(function() {
        doSettingsDialog();
        return false;
    });

    return this;
}

Tile.prototype.highlight = function (durationMillis)
{
    var jqContent = $(this.content);
    jqContent.addClass('highlightContainer', 500);
    if(durationMillis)
    {
        setTimeout(function (jqContentDiv) {
            jqContentDiv.removeClass('highlightContainer', 500);
        }, durationMillis, jqContent);
    }
    return this;
}


Tile.prototype.show = function (noAnim)
{
    if (!this.content)
    {
        console.error("Can't show a tile without content.");
    }

    var jqContent = $(this.content);
    $('#' + Tile.TILES_DIV_ID).append(jqContent);
    if (!noAnim)
    {
        jqContent.show(500);
    }
    else
    {
        jqContent.show();
    }
    return this;
}

Tile.prototype.showProminent = function ()
{
    Tile.suspendTiles(function (success, suspTile) {
        if(success)
        {
            suspTile.show();
        }
    }, this);

    return this;
}

////////////////// STATIC FUNCTIONS //////////////////

Tile.hideTiles = function (callback)
{
    $('.' + Tile.TILE_CSS_CLASS).hide(250, callback);
}

Tile.clearTilesCore = function ()
{
    $('#' + Tile.TILES_DIV_ID).empty();
}

Tile.clearTilesNoAnim = function ()
{
    Tile.clearTilesCore();
    Tile.suspendedTiles = null;
    Tile.theSuspendingTile = null;
}

Tile.clearTiles = function (callback)
{
    Tile.hideTiles(function () {
        Tile.clearTilesNoAnim();
        if (callback)
            callback();
    });
}

Tile.suspendTiles = function (callback, suspendingTile)
{
    if (Tile.suspendedTiles == null)
    {
        Tile.hideTiles(function () {
            // First hidden element triggers the suspension
            if (Tile.suspendedTiles == null)
            {
                Tile.suspendedTiles = $('.' + Tile.TILE_CSS_CLASS).detach();
                Tile.theSuspendingTile = suspendingTile;
                Tile.clearTilesCore();
                if (callback)
                    callback(true, suspendingTile);
            }
        });
    }
    else
    {
        // Tiles are already suspended
        Tile.theSuspendingTile.highlight(1000);
        if (callback)
            callback(false, suspendingTile);
    }
}

Tile.unsuspendTiles = function ()
{
    Tile.clearTilesCore();
    if (Tile.suspendedTiles != null)
        $('#' + Tile.TILES_DIV_ID).append(Tile.suspendedTiles);
    Tile.suspendedTiles.show(500);
    Tile.suspendedTiles = null;
    Tile.theSuspendingTile = null;
}

Tile.getKeyValueAsHTML = function (key, value)
{
    var para = $(document.createElement('p'));
    para.append($(document.createElement('span')).addClass('keyHighlight').text(key + " : "));
    para.append($(document.createElement('span')).text(value));
    return para;
}

Tile.refreshLayoutFormat = function ()
{
    var layout = SettingsStorage.getLayoutFormat();
    var jqTilesDiv = $('#' + Tile.TILES_DIV_ID);

    if (layout == 'inColumns')
    {
        jqTilesDiv.addClass('tilesInColumns').removeClass('tilesInRows');
    }
    else
    {
        jqTilesDiv.removeClass('tilesInColumns').addClass('tilesInRows');
    }

}

Tile.processSearch = function (func, arg0)
{
    Tile.clearTilesNoAnim();
    new Tile().setStaticTemplateContent('loadingContainer').show(true);

    func(arg0, function (msgs) {

        Tile.clearTilesNoAnim();

        if (msgs == null)
        {
            new Tile().setErrorContent("Sorry, something went wrong during search. :(").show();
            return;
        }

        if (Object.keys(msgs).length == 0)
        {
            new Tile().setStaticTemplateContent('noMatchesFoundContainer').show();
        }
        else
        {
            $.each(msgs, function(emailId, msg) {
                new Tile().setEmailContent(emailId, msg).show();
            });
        }

    });

}


