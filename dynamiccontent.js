/**
 * jQuery Dynamic Content Plugin
 * Github: http://github.com/yali4/dynamiccontent/
 * Link: http://yalcinceylan.net/dynamiccontent
 * Copyright: May 2013
 * Creator: Yalçın CEYLAN
 * Github: http://github.com/yali4/
 * Website: http://yalcinceylan.net
 * License: MIT <http://opensource.org/licenses/mit-license.php>
 */
function DynamicContent(table, modal, form, options)
{

    this.data = new Array();

    this.options = options;

    this.table = $(table).children('tbody');

    this.modal = $(modal);

    this.title = this.modal.find('.modal-title');

    this.form = $(form);

    var root = this;

    this.form.submit(function(event){

        event.preventDefault();

        root.submitAction();

    });

    this.hideMessages = function()
    {

        root.form.find('.control-group').removeClass('has-error');

        root.form.find('.help-block').hide();

    };

    this.setMessages = function(messages)
    {

        $.each(messages, function(id, message){

            var input = root.form.find('[name="'+id+'"]');

            if ( input.attr('type') !== 'hidden' )
            {
                input.parent().children('.help-block').html(message[0]).fadeIn();

                input.parent().parent().addClass('has-error');
            }

        });

    };

    this.hideModal = function()
    {

        this.title.empty();

        this.modal.modal('hide');

    };

    this.emptyForm = function()
    {

        var options = root.options;

        for ( i in options.usable )
        {
            var column = options.usable[i];

            root.form.find('[name="'+column+'"]').val(null);
        }

    };

    this.submitAction = function()
    {

        if ( root.form.attr('status') === 'true' ) return false;

        root.form.attr('status', 'true');

        root.hideMessages();

        var submit = root.form.find('button[type="submit"]');

        submit.button('loading');

        $.post(root.form.attr('action'), root.form.serialize(), function(response){

            switch (response.status)
            {
                case 'failed':
                    root.setMessages(response.errors);
                    break;

                case 'success':
                    root.createChild(response.item);
                    root.hideModal();
                    break;
            }

            submit.button('reset');

            root.form.removeAttr('status');

        }, 'JSON');

    };

    this.createChild = function(item)
    {

        var options = root.options;

        var primary = item[options.primary];

        root.data[primary] = item;

        var create = $('<tr/>', {id:primary});

        for ( i in options.columns )
        {
            var column = options.columns[i];

            create.append($('<td/>', {html:item[column]}));
        }

        var buttons = $('<td/>');

        for ( index in options.buttons )
        {
            var action = item.action[index];

            if ( typeof action !== 'undefined' )
            {
                var button = $.extend({className:null,childNode:null}, options.buttons[index]);

                var attributes = {
                    'data-action' : action,
                    'data-primary' : primary,
                    'data-controller' : index+'Action',
                    'class' : button.className,
                    'html' : button.childNode
                };

                $('<button/>', attributes).bind('click', function(){

                    return root.callback($(this));

                }).appendTo(buttons);
            }
        }

        buttons.appendTo(create);

        var container = root.table.children('tr[id="'+primary+'"]');

        if ( container.length ) return container.replaceWith(create);

        create.hide().appendTo(root.table).fadeIn();

    };

    this.callback = function(button)
    {

        var actions = root.options.actions;

        var action = button.attr('data-controller');

        if ( typeof this[action] === 'function') return this[action](button);

        if ( typeof actions[action] === 'function') return actions[action](button);

    };

    this.refresh = function(button)
    {

        var button = $(button);

        var action = button.attr('data-action');

        button.button('loading');

        $.get(action, function(response){

            root.refreshChilds(response);

            button.button('reset');

        }, 'JSON');

    };

    this.insert = function(button)
    {

        root.emptyForm();

        root.hideMessages();

        var options = root.options;

        var button = $(button);

        var action = button.attr('data-action');

        root.form.attr('action', action);

        root.title.html(options.captions.create);

        root.modal.modal();

    };

    this.editAction = function(button)
    {

        root.emptyForm();

        root.hideMessages();

        var options = root.options;

        var action = button.attr('data-action');

        var primary = button.attr('data-primary');

        var content = root.data[primary];

        for ( i in options.usable )
        {
            var column = options.usable[i];

            root.form.find('[name="'+column+'"]').val(content[column]);
        }

        root.form.attr('action', action);

        root.title.html(options.captions.edit);

        root.modal.modal();

    };

    this.removeAction = function(button)
    {



    };

    this.buildChilds = function(childs)
    {

        $.each(childs, function(key, row){

            root.createChild(row);

        });

    };

    this.refreshChilds = function(childs)
    {

        root.table.children('tr').each(function(){

            if ( !childs[this.id] )
            {
                $(this).fadeOut(function(){
                    this.remove();
                    root.data[this.id] = undefined;
                });
            }

        });

        root.buildChilds(childs);

    };

    return this;

}
