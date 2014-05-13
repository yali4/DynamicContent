/**
 * jQuery Dynamic Content Plugin
 * Github: http://github.com/yali4/dynamiccontent/
 * Link: http://yalcinceylan.net/dynamiccontent
 * Copyright: May 2014
 * Creator: Yalçın CEYLAN
 * Github: http://github.com/yali4/
 * Website: http://yalcinceylan.net
 * License: MIT <http://opensource.org/licenses/mit-license.php>
 */
function DynamicContent(options)
{

    var root = this;

    root.data = [];

    root.inputs = [];

    root.options = options;

    /**
     * Dizi Döndürür.
     *
     * @param array
     * @param callback
     */
    root.forEach = function(array, callback)
    {
        for ( var index in array )
        {
            callback(index, array[index]);
        }
    }

    /**
     * Başlangıç
     */
    root.setup = function()
    {
        // Varsayılan Olaylar
        root.options.events = $.extend({beforeForm:null, beforeSubmit:null}, root.options.events);

        // Seçilecek Olanlar
        root.forEach(root.options.select, function(index, value){

            root[index] = $(document.getElementById(value));

        });

        // Tablo Tanımlanıyor
        root.table = root.table.children('tbody');

        // Form Gönderilme Olayı
        root.form.submit(function(event){

            event.preventDefault();

            root.submitAction(this);

        });

        // Kullanılabilir Girişler
        root.forEach(root.options.usable, function(index, value){

            root.inputs[value] = root.form.find('[name="'+value+'"]');

        });
    };

    /**
     * Form Oluşturulmadan Önce
     */
    root.beforeForm = function()
    {
        var callback = options.events.beforeForm;

        if ( typeof  callback === 'function') callback.call(root, root.inputs);
    };

    /**
     * Form Gönderilmeden Önce
     */
    root.beforeSubmit = function()
    {
        var callback = options.events.beforeSubmit;

        if ( typeof callback === 'function') callback.call(root, root.inputs);
    };

    /**
     * Veri Tanımlar.
     *
     * @param primary
     * @param data
     */
    root.setChildData = function(primary, data)
    {
        root.data[primary] = data;
    };

    /**
     * Veri Getirir.
     *
     * @param primary
     * @returns {*}
     */
    root.getChildData = function(primary)
    {
        return root.data[primary];
    };

    /**
     * Veri Siler.
     *
     * @param primary
     */
    root.removeChildData = function(primary)
    {
        root.data[primary] = undefined;
    };

    /**
     * Modalı Gizler.
     */
    root.hideModal = function()
    {
        root.title.empty();

        root.modal.modal('hide');
        
        root.form.removeAttr('action');
    };

    /**
     * Formu Boşaltır.
     */
    root.emptyForm = function()
    {
        root.forEach(root.inputs, function(index){
            root.inputs[index].val(undefined);
        })
    };

    /**
     * Uyarıları Gizler.
     */
    root.hideMessages = function()
    {
        root.form.find('.control-group').removeClass('has-error');

        root.form.find('.help-block').hide();
    };

    /**
     * Uyarıları Tanımlar.
     *
     * @param messages
     */
    root.setMessages = function(messages)
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

    /**
     * Belirtilen Alanı Gösterir.
     *
     * @param button
     */
    root.showSection = function(button)
    {

        var section = $(button).attr('data-controller');

        var sections = root.options.sections;

        root.forEach(sections, function(index, value){
            root.modal.find('[data-section="'+value+'"]').hide();
        });

        root.modal.find('[data-section="'+sections[section]+'"]').show();

    };

    /**
     * Formu Gönderir.
     *
     * @return boolean
     */
    root.submitAction = function()
    {
        if ( root.form.attr('status') === 'true' ) return false;

        root.form.attr('status', 'true');

        root.hideMessages();

        root.beforeSubmit();

        var submit = root.form.find('button[type="submit"]');

        submit.button('loading');

        $.post(root.form.attr('action'), root.form.serialize(), function(response){

            switch (response.status)
            {
                case 'error':
                    root.hideModal();
                    break;

                case 'failed':
                    root.setMessages(response.errors);
                    break;

                case 'deleted':
                    root.removeChild(response.primary);
                    root.hideModal();
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

    /**
     * Yeni Çocuk Yaratır ya da Değiştirir.
     *
     * @param item
     */
    root.createChild = function(item)
    {
        var options = root.options;

        var primary = item[options.primary];

        root.setChildData(primary, item);

        var create = $('<tr/>', {id:primary});

        root.forEach(options.columns, function(index, column){

            create.append($('<td/>', {html:item[column]}));

        });

        var buttons = $('<td/>');

        root.forEach(options.buttons, function(index, value){

            var action = item.action[index] || null;

            var button = $.extend({className:null,childNode:null}, value);

            var attributes = {
                'data-action' : action,
                'data-primary' : primary,
                'data-controller' : index,
                'class' : button.className,
                'html' : button.childNode
            };

            $('<button/>', attributes).bind('click', function(){

                return root.callback(this);

            }).appendTo(buttons);

        });

        buttons.appendTo(create);

        var content = root.table.children('tr[id="'+primary+'"]');

        content.length ? content.replaceWith(create) : create.hide().appendTo(root.table).fadeIn();

    };

    /**
     * Geriçağrımları Yönetir.
     *
     * @param button
     */
    root.callback = function(button)
    {
        var actions = root.options.actions;

        var action = $(button).attr('data-controller');

        if ( typeof this[action] === 'function') return this[action](button);

        if ( typeof actions[action] === 'function') return actions[action].call(button, root);
    };

    /**
     * Yenileme Aksiyonu.
     *
     * @param button
     */
    root.refresh = function(button)
    {
        var button = $(button);

        var action = button.attr('data-action');

        button.button('loading');

        $.get(action, function(response){

            root.refreshChilds(response);

            button.button('reset');

        }, 'JSON');
    };

    /**
     * Oluşturma Paneli.
     *
     * @param button
     */
    root.insert = function(button)
    {
        root.emptyForm();

        root.beforeForm();

        root.hideMessages();

        var options = root.options;

        var button = $(button);

        var action = button.attr('data-action');

        root.form.attr('action', action);

        root.title.html(options.captions.create);

        root.showSection(button);

        root.modal.modal(options.modal);
    };

    /**
     * Düzenleme Paneli.
     *
     * @param button
     */
    root.edit = function(button)
    {
        root.emptyForm();

        root.hideMessages();

        var button = $(button);

        var options = root.options;

        var action = button.attr('data-action');

        var primary = button.attr('data-primary');

        var content = root.getChildData(primary);

        root.forEach(root.inputs, function(index){

            root.inputs[index].val(content[index]);

        });

        root.beforeForm();

        root.form.attr('action', action);

        root.title.html(options.captions.edit);

        root.showSection(button);

        root.modal.modal(options.modal);
    };

    /**
     * Silme Paneli.
     *
     * @param button
     */
    root.remove = function(button)
    {
        root.emptyForm();

        root.hideMessages();

        root.showSection(button);

        var button = $(button);

        var options = root.options;

        var action = button.attr('data-action');

        root.form.attr('action', action);

        root.title.html(options.captions.remove);

        root.modal.modal(options.modal);
    };

    /**
     * Birden Fazla Çocuk Yaratma.
     *
     * @param childs
     */
    root.buildChilds = function(childs)
    {
        $.each(childs, function(key, row){

            root.createChild(row);

        });
    };

    /**
     * Çocuk Öldürme.
     *
     * @param primary
     */
    root.removeChild = function(primary)
    {
        root.table.children('tr[id="'+primary+'"]').fadeOut(function(){

            $(this).remove();

        });

        root.removeChildData(primary);
    };

    /**
     * Çocukları Yeniler.
     *
     * @param childs
     */
    root.refreshChilds = function(childs)
    {
        root.table.children('tr').each(function(){

            if ( !childs[this.id] ) root.removeChild(this.id);

        });

        root.buildChilds(childs);
    };

    root.setup();

    return root;

}
