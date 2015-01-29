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

function DocumentTemplates()
{}

DocumentTemplates.templates = []

DocumentTemplates.loadElement = function (element)
{
    var eleToAdd = $(element).clone().detach().get(0);
    DocumentTemplates.templates.push(eleToAdd);
}

DocumentTemplates.loadAllChildren = function (rootElement)
{
    $.each($(rootElement).children().get(), function(idx, ele) {
        DocumentTemplates.loadElement(ele);
    });
}

DocumentTemplates.getByTemplateId = function (identifier)
{
    for (var i = 0; i < DocumentTemplates.templates.length; i++)
    {
        if (DocumentTemplates.templates[i].getAttribute('data-templateid') == identifier)
        {
            return $(DocumentTemplates.templates[i]).clone().get()[0];
        }
    }
    return null;
}

