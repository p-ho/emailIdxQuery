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

function EMailPrototype ()
{
    this.hasPrototypedMessage = false;
}

EMailPrototype.getMessageId = function ()
{
    return this.msg_id;
}

EMailPrototype.getMessage = function ()
{
    var msg = this.message;
    if (!msg)
        return null;
    if (!this.hasPrototypedMessage)
        msg.__proto__ = MessagePrototype;
    this.hasPrototypedMessage = true;
    return msg;
}

EMailPrototype.getAllMessages = function ()
{
    return this.getMessage().getAllDescendantMessages();
}


////////////////////////////////////////////////////////////////

function MessagePrototype ()
{
    this.hasPrototypedChildren = false;
    this.hasPrototypedDecryptedMessage = false;
}

MessagePrototype.getHeaderList = function (headerName)
{
    return headerName in this.headers ? this.headers[headerName] : [];
}

MessagePrototype.getHeader = function (headerName, defaultVal)
{
    var headerList = this.getHeaderList(headerName);
    return headerList.length >= 1 ? headerList[0] : defaultVal;
}

MessagePrototype.getChildMessages = function ()
{
    if (this.child_messages == null)
        return [];

    if(!this.hasPrototypedChildren)
    {
        $.each(this.child_messages, function (idx, childMsg) {
            childMsg.__proto__ = MessagePrototype;
        });
    }
    this.hasPrototypedChildren = true;
    return this.child_messages;
}

MessagePrototype.getDecryptedMessage = function ()
{
    if ('message_decrypted' in this && this.message_decrypted != null)
    {
        if (!this.hasPrototypedDecryptedMessage)
            this.message_decrypted.__proto__ = MessagePrototype;
        this.hasPrototypedDecryptedMessage = true;
        return this.message_decrypted;
    }
    else
    {
        return null;
    }
}

MessagePrototype.getAllDescendantMessages = function ()
{
    var resList = [this]
    var childMsgs = this.getChildMessages();
    $.each(childMsgs, function (idx, childMsg) {
        resList = resList.concat(childMsg.getAllDescendantMessages());
    });

    var decMsg = this.getDecryptedMessage();
    if (decMsg != null)
        resList = resList.concat(decMsg.getAllDescendantMessages());

    return resList;
}

MessagePrototype.getContentToDisplayInRows = function ()
{
    var theContent = this.getContentToDisplay();
    if (theContent == null)
        return null;
    return theContent.match(/^.*((\r\n|\n|\r)|$)/gm);
}

MessagePrototype.getContentToDisplay = function ()
{
    if ('content_parsed' in this && 'txt_contents' in this.content_parsed)
        return this.content_parsed.txt_contents;
    else
        return null;
}

MessagePrototype.hasContent = function ()
{
    return this.content != null;
}


MessagePrototype.getFileName = function ()
{
    if ('name' in this.content_type)
        return this.content_type.name;
    else
        return null;
}

MessagePrototype.isContentBase64Encoded = function ()
{
    var ctenc = this.getHeader('Content-Transfer-Encoding', null);

    if (ctenc != null)
    {
        return ctenc.indexOf('base64') > -1;
    }
    
    return false;
}

MessagePrototype.getContentAsDataUrl = function ()
{
    var base64data = null;
    
    if (this.isContentBase64Encoded())
    {
        base64data = this.content;
    }
    else
    {
        base64data = $.base64.encode(this.content);
    }
    
    return "data:" + this.content_type._type +  ";base64," + base64data;
}



