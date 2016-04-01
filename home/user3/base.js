function create_editor(id)
{
    editor = ace.edit("editor" + id);
    editor.getSession().setMode("ace/mode/textfile");
    editor.renderer.setShowPrintMargin(false);
    editor.renderer.setShowGutter(false); 
    editor.renderer.setHighlightGutterLine(false); 
    editor.setDisplayIndentGuides(false);
    editor.setHighlightActiveLine(false);
    editor.focus();
    editor.scrollToRow(0);
    editor.gotoLine(0);
    prepare_menu(id);
    activate_mousewheel(id);
    bind_editor_menu();
    editor.on('change', onchange);
    return editor
}

var changetimer = (function() 
{
    var timer; 
    return function() 
    {
        clearTimeout(timer);
        timer = setTimeout(function() 
        {
            get_symbols(current_container.file);
            symbol_selected_down();
            if(autosave === 'yes')
            {
                save_file(current_container.file)
            }
        }, 3000);
    };
})();

var sessiontimer = (function() 
{
    var timer; 
    return function() 
    {
        clearTimeout(timer);
        timer = setTimeout(function() 
        {
            save_session();
        }, 2000);
    };
})();

function configure_container(c)
{
    c.editor = create_editor(c.id);
    current_container = c;
    set_header_menu();
    set_settings();
    activate_focus(c.id);
    $('#container' + c.id).click(function(e)
    {
        if(e.which == 2)
        {
            e.preventDefault();
            return false;
        }
        var id = $(this).find('.container_id').val();
        container_click_events(id);
    })
}

function fix_height()
{
    for(var i=0;i<containers.length;i++)
    {
        set_editor_height(containers[i].id);
    }
}

function set_editor_height(id)
{
    if($('#outer_header' + id).css('display') != 'none')
    {
        height = $('#container' + id).height() - $('#outer_header' + id).outerHeight();
    }
    else
    {
        height = $('#container' + id).height()
    }
    try
    {
        $('#editor' + id).height(height);
        get_container(id).editor.resize();
    }catch(err){}
    try
    {
        $('#container' + id).find('.iframe').each(function()
        {
            $(this).height(height);
        })
    }catch(err){}
}

function activate_resize()
{
    $(window).resize(function()
        {       
            fix_height();
        });
}

function show_settings()
{
    s = template_settings();
    set_menu(s);
}

function show_tools()
{
    s = template_tools();
    set_menu(s);
}

function show_help()
{
    s = template_help();
    set_menu(s);
}

function show_keycodes()
{
    s = template_keycodes();
    set_menu(s);
    $('#txtChar').focus();
}

function show_text_generator()
{
    s = template_text_generator();
    set_menu(s); 
    $('#input_generator').focus();
    $('#input_generator').keypress();
}

function generate_text()
{
    var num = parseInt($('#input_generator').val());
    var s = ""
    for(var i=0;i<1000;i++)
    {
        var n = get_random_int(0, crap.length)
        k = crap.substring(n,n + 100);
        s += $.trim(k);
        if($('#radio_characters').is(':checked'))
        {
            if(s.length >= num)
            {
                s = s.substring(0,num);
                s = s.replace(/\s+$/,".")
                break;
            }            
        }
        else
        {
            var l = s.split(' ');
            if(l.length >= num)
            {
                var d = l.length - num;
                if(d > 0)
                {
                    l.splice(l.length - d , d);
                    s = l.join(' ');
                }
                break;
            }
        }
    }
    $('#text_generator_result').html(s);
}

function show_char_counter()
{
    show_menu();
    f = template_char_counter()
    set_menu(f)
    $('#text_counter').focus();
}

function show_color_picker()
{
    show_menu();
    f = template_color_picker();
    set_menu(f);
    $('#color_picker').ColorPicker(
    {
        flat: true
    });  
}
