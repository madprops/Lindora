var editor;
var username = '';
var servers = [];
var opened_files = [];
var current_container;
var themes = ["ambiance","chaos","chrome","clouds","clouds_midnight","cobalt","crimson_editor","dawn","dreamweaver","eclipse","github","idle_fingers","kr_theme","merbivore","merbivore_soft","mono_industrial","monokai","pastel_on_dark","solarized_dark","solarized_light","terminal","textmate","tomorrow","tomorrow_night","tomorrow_night_blue","tomorrow_night_bright","tomorrow_night_eighties","twilight","vibrant_ink","xcode"];
var header = 'login';
var EditSession;
var UndoManager;
var Range;
var HashHandler;
var loggedin;
var containers = [];
var panes = [];
var csrf_token;
var theme;
var header_visible;
var editor_font_size;
var header_font_size;
var header_font_color;
var header_font_family;
var header_background_color;
var last_working_path = '';
var last_working_ftp_path = '';
var clipboard = [];
var new_files = 0;
var keyboard_mode;
var show_gutter;
var show_line_numbers;
var token1 = '';
var token2 = '';
var save_the_token = true;
var pos1 = '';
var pos2 = '';
var lang;
var files_to_open = [];
var sessions = [];
var urls = [];

function init(args)
{
    HashHandler = ace.require('ace/keyboard/hash_handler').HashHandler;
    EditSession = ace.require("ace/edit_session").EditSession;
    UndoManager = ace.require("ace/undomanager").UndoManager;
    lang = ace.require("ace/lib/lang");
    Range = ace.require('ace/range').Range;
    fetch();
    compile_templates();
    register_helpers();
    get_settings();
    username = args['username'];
    csrf_token = args['csrf_token'];
    hide_menu();
    hide_ftp_browser();
    activate_mousewheel();
    prepare_menu();
    activate_key_detection();
    prepare_session();
    activate_resize();
    array_move();
    start_ruler();
    start_suggestions();
    start_symbols();
}
function start_ruler()
{
    t = template_ruler();
    $('body').append(t);
    $('.ruler').css('display','none'); 
    $('.ruler').draggable();
    $('.ruler').click(function(e)
        {
            if(e.which == 2)
            {
                flip_ruler();
                e.preventDefault();
            }
        });
    s = 'w:' + parseInt($('.ruler').css('width')) + '<br>h:' + parseInt($('.ruler').css('height'));
    $('.ruler_info').html(s)
    $('.ruler').resizable(
    {
        handles: 'n, e, s, w, ne, nw, se, sw',
        resize: function (event, ui)
        {
            s = 'w:' + parseInt($('.ruler').css('width')) + '<br>h:' + parseInt($('.ruler').css('height'));
            $('.ruler_info').html(s)
        }
    });
}
function show_ruler()
{
    hide_menu();
    $('.ruler').css('display', 'block');
}
function hide_ruler()
{
    $('.ruler').css('display', 'none');
}
function flip_ruler()
{
    w = parseInt($('.ruler').css('width'));
    h = parseInt($('.ruler').css('height'));
    $('.ruler').css('width', h);
    $('.ruler').css('height', w);
}
function first_pane()
{
    np = new_pane(false);
    pane = template_single_pane({id:np.id});
    $('body').append(pane);
/*    nc = new_container(false);
    container = template_container({id:nc.id})
    $('#a' + np.id).html(container);
    configure_container(nc);
    np.layout = start_layout($('body'));*/
}
function container_click_events(id)
{
    hide_suggestions();
    hide_symbols();
    current_container = get_container(id);
    set_title(current_container.file.head);
}
function start_layout(el)
{
        page_layout = el.layout({ 
            east__size:   '50%' 
        ,   north__size:   50 
        ,   north__maxSize: 50 
        ,   south__size:   '50%' 
        ,   spacing_open:  2 
        ,   togglerLength_open: 0 
        ,   togglerLength_closed: 0 
        ,   triggerEventsOnLoad: true 
        ,   resizerDblClickToggle: false
        ,   fxSettings_close:  { easing: "easeOutQuint" }
        ,   onresize_end:  function(){ fix_height()}
        ,   center__onresize: function (pane, $Pane, paneState)
            { 

            } 
        }); 
        return page_layout;
}
function restart_layout()
{
    $('.ui-layout-center').each(function()
    {
        $(this).parent().layout().destroy();
        start_layout($(this).parent());
    });
}
function File()
{
    this.session;
    this.name;
    this.tail;
    this.head;
    this.header;
    this.tokens;
    this.symbols;
    this.container
}
function get_current_file()
{
    c = current_container;
    for(var i=0;i<files.length;i++)
    {
        if(c.editor.getSession() == files[i].session)
        {
            return files[i];
        }
    }
}
function Container()
{
    this.id;
    this.editor;
    this.url = "x";
    this.file;
    this.files = []
}
function Pane()
{
    this.id;
    this.layout;
}
function Server()
{
    this.name;
    this.last_path = null;
}
function prepare_session()
{
    if(username!='')
    {
        loggedin = true;
    }
    else
    {
        loggedin = false;;
    }
}
function new_pane(id)
{
    pane = new Pane();
    if(id)
    {
        pane.id = id
    }
    else
    {
        if(panes.length > 0)
        {
            id = parseInt(panes[panes.length -1].id);
            var go = true;
            while(go)
            {
                id += 1;
                for(var i=0; i<panes.length; i++)
                {
                    if(panes[i].id === id)
                    {
                        continue;
                    }
                }
                go = false;
            }
            pane.id = id
        }
        else
        {
            pane.id = 0;
        }
    }
    panes.push(pane);
    return pane
}
function new_container(id)
{
    container = new Container();
    if(id)
    {
        container.id = id
    }
    else
    {
        if(containers.length > 0)
        {
            id = parseInt(containers[containers.length -1].id);
            var go = true;
            while(go)
            {
                id += 1;
                for(var i=0; i<containers.length; i++)
                {
                    if(containers[i].id === id)
                    {
                        continue;
                    }
                }
                go = false;
            }
            container.id = id
        }
        else
        {
            container.id = 0;
        }
    }
    containers.push(container);
    return container
}
function on_change(e)
{
    try
    {
        var code = (e.keyCode ? e.keyCode : e.which);
        if(code === 13 || code === 32)
        {
            save_token(token);
            hide_suggestions();
            return false;
        }
        var inp = String.fromCharCode(e.keyCode);
        if(/[a-zA-Z0-9-_ ]/.test(inp))
        {
            token = get_token_at_cursor()['value'].replace(/ +/g, '')
            show_suggestions();
        }
    }
    catch(err)
    {

    }
}
var onchange = function()
{
    changetimer();
}
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

editorFileMaps = []

function EditorFileMap()
{

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
function compile_templates()
{
    template_source_picker = Handlebars.compile($('#template_source_picker').html());
    template_new_ftp = Handlebars.compile($('#template_new_ftp').html());
    template_main_menu = Handlebars.compile($('#template_main_menu').html());
    template_settings = Handlebars.compile($('#template_settings').html());
    template_login = Handlebars.compile($('#template_login').html());
    template_theme_picker = Handlebars.compile($('#template_theme_picker').html());
    template_new_file = Handlebars.compile($('#template_new_file').html());
    template_new_ftp_file = Handlebars.compile($('#template_new_ftp_file').html());
    template_explorer = Handlebars.compile($('#template_explorer').html());
    template_split = Handlebars.compile($('#template_split').html());
    template_container = Handlebars.compile($('#template_container').html());
    template_ftp_explorer = Handlebars.compile($('#template_ftp_explorer').html());
    template_open_url = Handlebars.compile($('#template_open_url').html());
    template_iframe = Handlebars.compile($('#template_iframe').html());
    template_vertical_pane = Handlebars.compile($('#template_vertical_pane').html());
    template_horizontal_pane = Handlebars.compile($('#template_horizontal_pane').html());
    template_single_pane = Handlebars.compile($('#template_single_pane').html());
    template_ruler = Handlebars.compile($('#template_ruler').html());
    template_tools = Handlebars.compile($('#template_tools').html());
    template_keycodes = Handlebars.compile($('#template_keycodes').html());
    template_text_generator = Handlebars.compile($('#template_text_generator').html());
    template_char_counter = Handlebars.compile($('#template_char_counter').html());
    template_color_picker = Handlebars.compile($('#template_color_picker').html());
    template_tabs = Handlebars.compile($('#template_tabs').html());
    template_header_settings = Handlebars.compile($('#template_header_settings').html());
    template_editor_settings = Handlebars.compile($('#template_editor_settings').html());
    template_behaviour_settings = Handlebars.compile($('#template_behaviour_settings').html());
    template_help = Handlebars.compile($('#template_help').html());
    template_save_as_explorer = Handlebars.compile($('#template_save_as_explorer').html());
    template_save_as_ftp_explorer = Handlebars.compile($('#template_save_as_ftp_explorer').html());
    template_suggestions = Handlebars.compile($('#template_suggestions').html());
    template_sessions = Handlebars.compile($('#template_sessions').html());
    template_session_item_edit = Handlebars.compile($('#template_session_item_edit').html());
    template_suggestion_items = Handlebars.compile($('#template_suggestion_items').html());
    template_symbols = Handlebars.compile($('#template_symbols').html());
    template_symbol_items = Handlebars.compile($('#template_symbol_items').html());
    template_save_as_picker = Handlebars.compile($('#template_save_as_picker').html());
}
function register_helpers()
{
    Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    if( lvalue!=rvalue ) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
    });

    Handlebars.registerHelper("foreach",function(arr,options) {
    if(options.inverse && !arr.length)
        return options.inverse(this);

    return arr.map(function(item,index) {
        item.$index = index;
        item.$first = index === 0;
        item.$last  = index === arr.length-1;
        return options.fn(item);
    }).join('');
});
}
function array_move()
{
    Array.prototype.move = function(from, to) 
    {
        this.splice(to, 0, this.splice(from, 1)[0]);
    };
}
function show_menu()
{
    $('#outer_menu').css('visibility','visible');
}
function show_open_url()
{
    show_menu();
    template = template_open_url({urls:urls});
    set_menu(template);
    $('#input_url').focus();
}
function open_input_url()
{
    open_url($('#input_url').val(), current_container);
}
function open_url(url, container)
{
    if(container === undefined)
    {
        container = current_container;
    }
    hide_menu();
    if(url.indexOf('http') == -1)
    {
        url = "http://" + url;
    }
    load_url_file(url, container)
    template = template_iframe({id:container.id,url:url});
    $("#outer_header" + container.id).after(template)
    $('#editor' + container.id).css('display','none');
    fix_height();
    $("[id='iframe" + container.id + '-' + url + "']").iframeTracker(
    {
        blurCallback: function()
        {
            var cid = $("[id='iframe" + container.id + '-' + url + "']").parent().find('.container_id').val()
            current_container = get_container(cid);
            hide_ruler();
            hide_menu();
        }
    });
    save_url(url);
    for(var i=0; i<files_to_open.length; i++)
    {
        var f = files_to_open[i];
        if(f.name === url && f.container === container)
        {
            files_to_open.splice(i, 1);
            if(files_to_open.length > 0)
            {
                var nf = files_to_open[0];
                open_file(nf.name, nf.container)
            }
            break;
        }
    }
    sessiontimer();
}
function save_url(url)
{
    $.post('/save_url/',
       {
           url: url,
           csrfmiddlewaretoken: csrf_token
       },
    function(data) 
    {
        get_urls();
    });
}
function get_urls()
{
    $.get('/get_urls/',
    {
    },
    function(data) 
    {
        urls = data['urls']
    });
}
function hide_menu()
{
    $('#outer_menu').css('visibility','hidden');
    hide_overlay();
}
function get_server(name)
{
    for(var i=0;i<servers.length;i++)
    {
        if(servers[i].name == name)
        {
            return servers[i];
        }
    }
    return false;
}
function save_server(name)
{
    if(get_server(name))
    {

    }  
    else
    {
        s = new Server();
        s.name = name;
        servers.push(s);
    }
}
function fetch()
{
    $.get('/fetch/',
        {
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            for(var i=0;i<data['servers'].length;i++)
            {
                save_server(data['servers'][i]);
            }
            urls = data['urls']
            sessions = data['sessions']
            load_session(data['session'])
            return false;
        }
        return false;
    });
    return false;
}
function load_session(s)
{
    panes = [];
    containers = [];
    first_pane();
    $('#a0').html(s);
    $session = $('#a0').clone();
    $session.find('.container').each(function()
    {
        var container_id = parseInt($(this).find('.container_id').val());
        var container = new_container(container_id);
        configure_container(container);
        num_files = $(this).find('.tab').length + $(this).find('.iframe').length
        if(num_files === 0)
        {
            new_file(container);
        }
        else
        {
            $($(this).find('.tab').get().reverse()).each(function()
            {
                var name = $(this).attr('title');
                var file = new File();
                file.name = name;
                file.container = container;
                files_to_open.push(file);
            })
        }
    });
    $session.find('.ui-layout-center').each(function()
    {
        var id = parseInt($(this).attr('id').substring(1));
        new_pane(id);
    });
    if(files_to_open.length > 0)
    {
        var f = files_to_open[0];
        open_file(f.name, f.container)
    }
    restart_layout();
    fix_height();
}
function place_files()
{
    $('.container').each(function()
    {
        container_id = $(this).find('.container_id').val()
        container = get_container(container_id)
        $(this).find('.tab').each(function()
        {
            var tid = $(this).attr('id');
            var name = tid.split('^')[1]
        })
    })
    for(var i=0; i<containers.length; i++)
    {
        make_tabs(containers[i])
    }
}
function save_session()
{
    $clone = $('#a0').clone()
    $clone.find('.editor').each(function()
    {
        $(this).html('');
    })
    $clone.find('.ui-layout-resizer').each(function()
    {
        $(this).remove()
    })
    $clone.find('.iframe').each(function()
    {
        $(this).remove()
    })
    $clone.find('.tab').each(function()
    {
        if($(this).attr('title').substring(0,3) === 'new')
        {
            $(this).remove();
        }
    })
    $.post('/save_session/',
        {
            content: $clone.html(),
            csrfmiddlewaretoken: csrf_token
        },
    function(data) 
    {

    });
}
function close_file(file)
{
    if(file === undefined)
    {
        return false;
    }
    var container = file.container
    var files = container.files;
    for(var i=0; i<files.length; i++)
    {
        if(files[i] === file)
        {
            if(files.length === 1)
            {
                if(container.id !== 0)
                {
                    close_container($('#container' + container.id));   
                }
                else
                {
                    container.file = new_file(container)
                }
            }
            else
            {
                if(i === 0)
                {
                    container.file = files[i + 1]
                }
                else
                {
                    container.file = files[i - 1]
                }
            }
            files.splice(i, 1);
        }
    }
    show_file(container.file);
}
function activate_mousewheel(id)
{
    $('#outer_header' + id).bind('mousewheel', function(event, delta, deltaX, deltaY) 
    {
        current_container = get_container(id);
        if(delta < 0)
        {
                prev();
        }
        else
        {
                next();
        }
    });
}
function get_file(name)
{
    for(var i=0;i<files.length;i++)
    {
        if(files[i].name==name)
        {
            return files[i];
        }
    }
}
function get_file_by_container(name, container)
{
    for(var i=0;i<container.files.length;i++)
    {
        if(container.files[i].name==name)
        {
            return container.files[i];
        }
    }
}
function prev()
{
    var dfiles = current_container.files
    var prev_file = dfiles[dfiles.indexOf(current_container.file)+1];
    if(prev_file)
    {
        show_file(prev_file);
    }
}

function next()
{
    dfiles = current_container.files
    var next_file = dfiles[dfiles.indexOf(current_container.file)-1];
    if(next_file)
    {
        show_file(next_file);
    }
}
function move_file_left()
{
    for(var i=0; i<current_container.files.length; i++)
    {
        if(current_container.files[i] === current_container.file)
        {
            if(i !== 0)
            {
                current_container.files.move(i, i - 1)
                break;
            }
        }
    }
    make_tabs(current_container);
}
function move_file_right()
{
    for(var i=0; i<current_container.files.length; i++)
    {
        if(current_container.files[i] === current_container.file)
        {
            if(i !== (current_container.files.length -1))
            {
                current_container.files.move(i, i + 1)
                break;
            }
        }
    }
    make_tabs(current_container);
}
function prepare_menu(id)
{
    $('#editor' + id).click(function(e)
    {
        hide_menu();
        hide_ruler();
        hide_ftp_browser();
    })
}
function activate_focus(id)
{
    $('#container' + id).focus(function()
    {
        current_container = get_container(id);
        hide_ruler();
    })
    get_container(id).editor.on("focus", function() {
        current_container = get_container(id);
    });
}
function show_source_picker()
{
    show_menu();
    s = template_source_picker({servers:servers});
    set_menu(s);
    return false;
}
function set_menu(s)
{
    $('#menu').html(s);
    $('#outer_menu').scrollTop(0);
}
function make_link(args)
{
    s = "";
    s += "<a href='#' onclick='" + args[1] + "(";
    for(var i=0;i<args.length-2;i++)
    {
        s += args[i+2] + ","
    }
    s += ");return false;'>" + args[0] + "</a>";
    return s;
}
function show_new_ftp_server()
{
    show_menu();
    s = template_new_ftp();
    set_menu(s);
    $('#ftp_host_input').focus();
}
function show_new_file()
{
    show_menu();
    s = template_new_file({servers:servers});
    set_menu(s);
}
function show_explorer(path)
{
    if(path=='')
    {
        path = last_working_path;
    }
    $.get('/explorer/',
        {
            path:path,
            mode:'explorer',
            action: 'normal',
        },
    function(data) 
    {
        if(data['status'] == 'list')
        {
            last_working_path = data['path'];
            if(data['back'] === '')
            {
                close_on_back = true;
            }
            else
            {
                close_on_back = false;
            }
            s = template_explorer(
            {
                username:username,
                path:data['path'],
                files:data['files'],
                back: data['back'],
                close_on_back: close_on_back
            });
            set_menu(s);
            show_menu();
            $('#inputpath').focus().val($("#inputpath").val());
            $('#inputpath').blur();
            $('#inputpath').focus();
            try
            {
                $('#inputpath').dispatchEvent(e);
            }
            catch(err)
            {
            }
        }
        else if(data['status'] == 'open')
        {
            open_file(data['path'], current_container, true);
            hide_menu();
        }
        else if(data['status'] == 'nodir')
        {
            $('#inputpath').val(last_working_path);
        }
        return false;
    });
}
function save_as_picker()
{
    t = template_save_as_picker({servers:servers});
    set_menu(t);
    show_menu();
}
function save_as_explorer(path, action)
{
    $.get('/explorer/',
        {
            path: path,
            mode: 'save_as',
            action: action
        },
    function(data) 
    {
        if(data['status'] == 'list')
        {
            last_working_path = data['path'];
            if(data['back'] === '')
            {
                close_on_back = true;
            }
            else
            {
                close_on_back = false;
            }
            s = template_save_as_ftp_explorer(
            {
                username:username,
                path:data['path'],
                files:data['files'],
                back: data['back'],
                close_on_back: close_on_back
            });
            set_menu(s);
            show_menu();
            $('#inputpath').focus().val($("#inputpath").val());
            $('#inputpath').blur();
            $('#inputpath').focus();
        } 
        else if(data['status'] == 'open')
        {
            old_name = current_container.file.name;
            current_container.file.name = data['path']
            current_container.file.tail = get_tail(current_container.file.name)
            current_container.file.head = get_head(current_container.file.name)
            make_tabs(current_container);
            hide_menu();
            set_mode(current_container.file.name)
            save_file(current_container.file)
            $.get('/remove_file/',
            {
                name:old_name
            },
            function(data) 
            {
            });
        }
        else if(data['status'] == 'nodir')
        {
            $('#inputpath').val(last_working_path);
        }
        return false;
    });
}
function save_as_ftp_explorer(path, action)
{
    show_overlay();
    $.get('/ftp_explorer/',
        {
            path: path,
            mode: 'save_as',
            action: action
        },
    function(data) 
    {
        hide_overlay();
        if(data['status'] == 'list')
        {
            last_working_path = data['path'];
            if(data['back'] === '')
            {
                close_on_back = true;
            }
            else
            {
                close_on_back = false;
            }
            s = template_save_as_ftp_explorer(
            {
                username:username,
                fake_path:data['fake_path'],
                path:data['path'],
                files:data['files'],
                back: data['back'],
                close_on_back: close_on_back
            });
            set_menu(s);
            show_menu();
            $('#inputpath').focus().val($("#inputpath").val());
            $('#inputpath').blur();
            $('#inputpath').focus();
        } 
        else if(data['status'] == 'open')
        {
            old_name = current_container.file.name;
            current_container.file.name = data['path']
            current_container.file.tail = get_tail(current_container.file.name)
            current_container.file.head = get_head(current_container.file.name)
            make_tabs(current_container);
            hide_menu();
            set_mode(current_container.file.name)
            save_file(current_container.file)
            $.get('/remove_file/',
            {
                name:old_name
            },
            function(data) 
            {
            });
        }
        else if(data['status'] == 'nodir')
        {
            $('#inputpath').val(last_working_path);
        }
        return false;
    });
}
function get_last_ftp_server_path(path)
{
    name = path.split('&')[0];
    for(var i=0;i<servers.length;i++)
    {
        if(servers[i].name == name)
        {
            if(servers[i].last_path != null)
            {
                return servers[i].last_path;
            }
        }
    }
    return false;
}
function set_last_ftp_server_path(path)
{   
    name = path.split('&')[0];
    for(var i=0;i<servers.length;i++)
    {
        if(servers[i].name == name)
        {
            servers[i].last_path = path;
            return true;
        }
    } 
}
function show_ftp_explorer(path)
{
    if(path.indexOf('&') == -1)
    {
        lp = get_last_ftp_server_path(path);
        if(lp)
        {
            path = lp;
        }
    }
    show_overlay();
    $.get('/ftp_explorer/',
        {
            path:path,
            mode:'normal',
            action:'explore'
        },
    function(data) 
    {
        hide_overlay();
        if(data['status'] == 'list')
        {
            set_last_ftp_server_path(data['path']);
            if(data['back'] === '')
            {
                close_on_back = true;
            }
            else
            {
                close_on_back = false;
            }
            s = template_ftp_explorer(
            {
                username:username,
                fake_path:data['fake_path'],
                path:data['path'],
                files:data['files'],
                back: data['back'],
                close_on_back: close_on_back,
            });
            set_menu(s);
            show_menu();
            $('#inputpath_ftp').focus().val($("#inputpath_ftp").val());
            $('#inputpath_ftp').blur();
            $('#inputpath_ftp').focus();
            try
            {
                $('#inputpath_ftp').dispatchEvent(e);
            }
            catch(err)
            {
            }
        }
        else if(data['status'] == 'open')
        {
            open_file(data['path'], current_container, true);
            hide_menu();
        }
        else if(data['status'] == 'nodir')
        {
            $('#inputpath_ftp').val(get_last_ftp_server_path(path));
        }
        return false;
    });
}
function connect_new_server()
{
    host = $('#ftp_host_input').val();
    user = $('#ftp_user_input').val();
    password = $('#ftp_password_input').val();
    $.get('/connect_new_server/',
        {
            host: host,
            user: user,
            password: password
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            show_ftp_explorer(data['name']);
            return false;
        }
        return false;
    });
    return false;
} 
function hide_ftp_browser()
{
    $('#ftp_browser').css('visibility','hidden');
}
function open_menu()
{
    if($('#outer_menu').css("visibility") == "visible")
    {
        hide_menu();
        return false;
    }
    show_main_menu();
} 
function show_main_menu()
{
    current_container.editor.blur();
    show_menu();
    data = {loggedin:loggedin, files: get_files()};
    s = template_main_menu(data);
    set_menu(s);
    bind_file_list_menu();
    $('#filelist a').each(function()
    {
        $(this).click(function(e)
        {
            var name = $(this).attr('id')
            if(e.which == 1)
            {
                if(file_in_container(name))
                {
                    var file = get_file_by_container(name, current_container);
                    show_file(file);
                }
                else
                {
                    var file = get_first_file_by_name(name)
                    clone_file(file, current_container)
                }
                hide_menu();
            }
            if(e.which == 2)
            {

            }
            return false;
        })
    })
}
function file_in_container(name)
{
    for(var i=0; i<current_container.files.length; i++)
    {
        if(current_container.files[i].name === name)
        {
            return true;
        }
    }
    return false;
}
function bind_file_list_menu(id)
{
    try
    {
        $('.filelist_link').each(function()
            {
                $(this).destroyContextMenu();
            });
    }
    catch(err){}
    $('.filelist_link').each(function()
    {
        $(this).contextMenu({
        menu: "file_list_menu"
        },
        function(action, el, pos) 
        {
            if(action=='remove')
            {
                var name = el.parent().find('.nameholder').val();
                el.remove();
                remove_file(name);
            }
        });
    })
}
function bind_header_menu(id)
{
    try
    {
        $('#outer_header' + id).destroyContextMenu();
    }
    catch(err){}
    $("#outer_header" + id).contextMenu({
        menu: "header_menu"
    },
    function(action, el, pos) 
    {
        if(action=='split_vertical')
        {
           split_vertical($(el).parent());
        }
        if(action=='split_horizontal')
        {
           split_horizontal($(el).parent());
        }
    });
} 
function bind_header_menu2(id)
{
    try
    {
        $('#outer_header' + id).destroyContextMenu();
    }
    catch(err){}
    $('#outer_header' + id).contextMenu({
        menu: "header_menu2"
    },
    function(action, el, pos) 
    {
        if(action=='split_vertical')
        {
           split_vertical($(el).parent());
        }
        if(action=='split_horizontal')
        {
           split_horizontal($(el).parent());
        }
        if(action=='close')
        {
           close_container($(el).parent());
        }
    });
}
function bind_iframe_header_menu(id)
{
    try
    {
        $('#outer_header' + id).destroyContextMenu();
    }
    catch(err){}
    $('#outer_header' + id).contextMenu({
        menu: "iframe_header_menu"
    },
    function(action, el, pos) 
    {
        if(action=='reload')
        {
           reload_iframe($(el).parent());
        }
        if(action=='split_vertical')
        {
           split_vertical($(el).parent());
        }
        if(action=='split_horizontal')
        {
           split_horizontal($(el).parent());
        }
        if(action=='close')
        {
           close_container($(el).parent());
        }
    });
}
function bind_editor_menu()
{
    try
    {
        $('.editor').destroyContextMenu();
    }
    catch(err){}
    $(".editor").contextMenu({
        menu: "editor_menu"
    },
    function(action, el, pos) 
    {
        if(action=='cut')
        {
            row = get_editor().getCursorPosition()['row'];
            t = get_editor().getCopyText();
            if(t != "")
            {
                clipboard.push(t);
                get_editor().insert('');         
            }
            else
            {
                get_editor().gotoLine(row + 1);
                get_editor().removeToLineEnd();
                var range = new Range.fromPoints({row:row -1, column:30000}, {row:row,column:1});
                get_editor().session.remove(range);
            }
        }
        if(action=='copy')
        {
            t = get_editor().getCopyText();
            if(t != "")
            {
                clipboard.push(t);
            }
        }
        if(action=='paste')
        {
            get_editor().insert(clipboard[clipboard.length -1]); 
        }
        if(action=='up')
        {
            get_editor().moveLinesUp(); 
        }
        if(action=='down')
        {
            get_editor().moveLinesDown(); 
        }
        if(action=='duplicate')
        {
            get_editor().duplicateSelection(); 
        }
    });
}
function get_neighbours(id)
{
    c = get_container(id);
    return {up:c.belowof, down:c.aboveof, left:c.rightof, right:c.leftof}
}
function get_container_index(id)
{
    for(var i=0;i<containers.length;i++)
    {
        if(containers[i].id == id)
        {
            return i;
        }
    }
}
function get_session()
{
    return current_container.file.session;
}
function set_header_menu()
{
    bind_header_menu(0);
    for(var i=1;i<containers.length;i++)
    {
        if($('#iframe' + containers[i].id).is(':visible'))
        {
            bind_iframe_header_menu(containers[i].id);
        }
        else
        {
            bind_header_menu2(containers[i].id);     
        }
    }
}

function get_pane(id)
{
    for(var i=0;i<panes.length;i++)
    {
        if(panes[i].id == id)
        {
            return panes[i]
        }
    }
}

function close_container(el)
{
    container_id = el.find('.container_id').val();
    var id = el.parent().attr('id').substr(1)
    var letter = el.parent().attr('id').substr(0,1)
    $p = el.parent().parent();
    var pid = el.parent().parent().attr('id').substr(1);
    var pletter = el.parent().parent().attr('id').substr(0,1);
    if(letter === 'a')
    {
        children = $('#b' + id).children();
    }
    else if(letter === 'b')
    {
        children = $('#a' + id).children();
    }
    el.parent().parent().layout().destroy();
    children.appendTo(el.parent().parent())
    el.parent().parent().find('.ui-layout-resizer').remove()
    $('#b' + id).remove();
    $('#a' + id).remove();
    remove_container(container_id);
    restart_layout();
    start_layout($('body'));
    next_container_id = $p.find('.container_id').val();
    get_container(next_container_id).editor.focus();
    fix_height();
    sessiontimer();
}

function split_horizontal(el) 
{  
    np = new_pane(false);
    pane = template_horizontal_pane({id:np.id});
    el.after(pane);
    el.appendTo($('#a' + np.id));
    nc = new_container(false);
    container = template_container({id:nc.id});
    $('#b' + np.id).html(container);
    file = current_container.file
    configure_container(nc);
    clone_file(file, nc);
    restart_layout();
    show_file(current_container.file)
    get_editor().removeListener('change', onchange);
    fix_height();
    sessiontimer();
} 

function split_vertical(el) 
{
    np = new_pane(false);
    pane = template_vertical_pane({id:np.id});
    el.after(pane);
    el.appendTo($('#a' + np.id));
    nc = new_container(false);
    container = template_container({id:nc.id});
    $('#b' + np.id).html(container);
    file = current_container.file
    configure_container(nc);
    clone_file(file, nc);
    restart_layout();
    show_file(current_container.file)
    get_editor().removeListener('change', onchange);
    fix_height();
    sessiontimer();
}  
function set_title(title)
{
    document.title = title;
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
function count_chars()
{
    if($('#radio_characters').is(':checked'))
    {
        var n = $('#text_counter').val().length
        if(n == 1)
        {
            $('#counter_result').html(n + ' character');
        }
        else
        {
            $('#counter_result').html(n + ' characters');
        }
    }
    else
    {
        if($.trim($('#text_counter').val()).length == 0)
        {
            n = 0;
        }
        else
        {
            n = $.trim($('#text_counter').val().replace(/ +/g, " ")).split(' ').length
        }
        if(n == 1)
        {
            $('#counter_result').html(n + ' word');
        }
        else
        {
            $('#counter_result').html(n + ' words');
        }
    }
    $('#text_counter').focus();
}
function get_random_int(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function show_header_settings()
{
    s = template_header_settings({
        header_font_size:header_font_size,
        header_font_color:header_font_color,
        header_font_family:header_font_family,
        header_background_color:header_background_color,
    });
    set_menu(s);
}
function save_header_settings()
{
    hide_menu();
    $.get('/save_header_settings/',
        {
            header_font_size: $('#input_header_font_size').val(),
            header_font_color: $('#input_header_font_color').val(),
            header_font_family: $('#input_header_font_family').val(),
            header_background_color: $('#input_header_background_color').val(),
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            get_settings();
        }
        return false;
    });
    return false;    
}
function show_editor_settings()
{
    s = template_editor_settings({
        theme:theme,
        editor_font_size:editor_font_size,
        keyboard_mode:keyboard_mode,
    });
    set_menu(s);
    $("#keyboard_mode option:contains('" + keyboard_mode + "')").prop('selected',true);
    $("#show_gutter option:contains('" + show_gutter + "')").prop('selected',true);
    $("#show_line_numbers option:contains('" + show_line_numbers + "')").prop('selected',true);
}
function save_editor_settings()
{
    hide_menu();
    $.get('/save_editor_settings/',
        {
            theme:theme,
            editor_font_size: $('#input_editor_font_size').val(),
            show_gutter: $('#show_gutter option:selected').text(),
            show_line_numbers: $('#show_line_numbers option:selected').text(),
            keyboard_mode: $('#keyboard_mode option:selected').text(),
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            get_settings();
        }
        return false;
    });
    return false;    
}
function show_behaviour_settings()
{
    s = template_behaviour_settings();
    set_menu(s);
    $("#autosave option:contains('" + autosave + "')").prop('selected',true);
}
function save_behaviour_settings()
{
    hide_menu();
    $.get('/save_behaviour_settings/',
        {
            autosave: $('#autosave option:selected').text(),
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            get_settings();
        }
        return false;
    });
    return false;    
}
function show_sessions()
{
    s = template_sessions({sessions:sessions});
    set_menu(s);
    if(sessions.length > 1)
    {
        menu = 'sessions_menu'
    }
    else
    {
        menu = 'sessions_menu_single'
    }
    $('.session_item').each(function()
    {
        $(this).contextMenu
        ({
            menu: menu
        },
        function(action, el, pos) 
        {
            if(action === 'rename')
            {
                old_session_name = $.trim(el.html());
                s = template_session_item_edit();
                el.html(s)
                el.find('input').focus();
                el.find('input').blur(function()
                {
                    session_edit_enter();
                })
            }
            if(action === 'remove')
            {
                remove_session($.trim(el.html()));
            }
        });
    });
}
function session_edit_enter()
{
    new_session_name = $.trim($('.session_item_edit').val());
    $('.session_item_edit').parent().html(new_session_name)
    $.post('/rename_session/',
        {
            old_name: old_session_name,
            new_name: new_session_name,
            csrfmiddlewaretoken: csrf_token
        },
    function(data) 
    {
        sessions = data['sessions']
        show_sessions();
    });
}
function new_session()
{
    $.post('/new_session/',
        {
            csrfmiddlewaretoken: csrf_token
        },
    function(data) 
    {
        location.reload();
    });
}
function remove_session(name)
{
    $.post('/remove_session/',
        {
            name: name,
            csrfmiddlewaretoken: csrf_token
        },
    function(data) 
    {
        sessions = data['sessions']
        show_sessions();
    });
}
function change_session(name)
{
    $.post('/change_session/',
        {
            name: name,
            csrfmiddlewaretoken: csrf_token
        },
    function(data) 
    {
        location.reload();
    });
}
function toggle_header()
{
    if($('#outer_header' + current_container.id).is(':visible'))
    {
        $('#outer_header' + current_container.id).css('display', 'none');
        pane = $('#outer_header' + current_container.id).parent().parent();
        fix_height();
    }
    else
    {
        $('#outer_header' + current_container.id).css('display', 'block');
        fix_height();
    }
}
function activate_key_detection()
{
    $(document).keyup(function(e)
     {
        var code = (e.keyCode ? e.keyCode : e.which);
        if(current_container.editor.isFocused())
        {
            on_change(e);
        }
        // escape
        if (code == 27)
        {
            if($('#outer_menu').is(':visible'))
            {
                if(!$('#txtChar').is(':visible'))
                {
                    hide_menu();
                }
            }
            hide_suggestions();
            hide_symbols();
        }
     });
    $(document).keydown(function(e)
    {
        var code = (e.keyCode ? e.keyCode : e.which);
        if(e.ctrlKey)
        {
            if(e.shiftKey)
            {
                // u - open url
                if(code == 79)
                {
                    show_open_url();
                    e.preventDefault();
                } 
                // h - toggle header
                if(code == 72)
                {
                    toggle_header();
                    e.preventDefault();
                } 
                // r - ruler
                if(code == 82)
                {
                    toggle_ruler();
                    e.preventDefault();
                } 
                // s - save all
                if(code == 83)
                {
                    save_all();
                    e.preventDefault();
                }
                return false;
            }
            // g - goto
            if(code == 71)
            {
                show_symbols();
                e.preventDefault();
            }
            // s - save
            if(code == 83)
            {
                save_file(current_container.file);
                e.preventDefault();
            }
            // o - open
            if(code == 79)
            {
                show_server_picker();
                e.preventDefault();
            } 
            // space - menu
            if(code == 32)
            {
                open_menu();
                e.preventDefault();
            } 
            if(code == 82)
            {
                reload();
                e.preventDefault();
            } 
            // e - explorer
            if(code == 69)
            {
                show_explorer('');
                e.preventDefault();
            } 

        }
        if(e.altKey)
        {
            if(e.shiftKey)
            {            
                // , - move file left
                if(code == 188)
                {
                    move_file_left();
                    e.preventDefault();
                }             
                // . - move file right
                if(code == 190)
                {
                    move_file_right();
                    e.preventDefault();
                } 
            }
            else
            {
                // n - new file
                if(code == 78)
                {
                    new_file(current_container);
                    e.preventDefault();
                } 
                // h - split horizontal
                if(code == 72)
                {
                    split_horizontal($('#container' + current_container.id));
                    e.preventDefault();
                } 
                // v - split vertical
                if(code == 86)
                {
                    split_vertical($('#container' + current_container.id));
                  
                }
                // x - close container
                if(code == 88)
                {
                    close_container($('#container' + current_container.id));
                    e.preventDefault();
                }            
                // , - next file
                if(code == 188)
                {
                    next();
                    e.preventDefault();
                }             
                // . - prev file
                if(code == 190)
                {
                    prev();
                    e.preventDefault();
                }              
            }
        }
        if(code==13)
        {
            if($('#inputpath').is(':focus'))
            {
                show_explorer($('#inputpath').val());
                e.preventDefault;
            }
            if($('#inputpath_ftp').is(':focus'))
            {
                show_ftp_explorer($('#inputpath_ftp').val().replace(':/','&'));
                e.preventDefault;
            }
            if($('#inputpath_save_as').is(':focus'))
            {
                save_as_explorer($('#inputpath_save_as').val().replace(':/','&'), 'save');
                e.preventDefault;
            }
            if($('#inputpath_save_as_ftp').is(':focus'))
            {
                save_as_ftp_explorer($('#inputpath_save_as_ftp').val().replace(':/','&'), 'save');
                e.preventDefault;
            }
            if($('#input_url').is(':focus'))
            {
                open_input_url();
                e.preventDefault;
            }
            if($('.session_item_edit').is(':focus'))
            {
                session_edit_enter();
                e.preventDefault;
            }
        }
    });
    return false;
}
function toggle_ruler()
{
    if($('.ruler').is(':visible'))
    {
        $('.ruler').css('display','none')
    }
    else
    {
        $('.ruler').css('display','block')
    }
}
function progress(s, c)
{
    $('#header' + c.id).html(s);
}
function save_all()
{
    for(var i=0;i<files.length;i++)
    {
        save_file(files[i]);
    }
}
function save_file(file)
{
    if(current_container.file == '')
    {
        return false;
    }
    if(file === '')
    {
        file = current_container.file
    }
    if(file.name.substring(0,3) === 'new')
    {
        save_as_picker();
        return false;
    }
    var fc = get_file_container(file);
/*    if(fc)
    {
        progress('saving...', fc);
    }*/
    $.post('/save_file/',
        {
            name: file.name,
            text:file.session.getValue(),
            csrfmiddlewaretoken: csrf_token
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            return false;
        }
        return false;
    });
    return false;
}
function get_file_container(file)
{
    for(var i=0;i<containers.length;i++)
    {
        if(containers[i].editor.getSession() == file.session)
        {
            return containers[i]
        }
    }
    return false;
}
function show_login()
{
    show_menu();
    s = template_login();
    set_menu(s);
    $('#login_username').focus();
}
function set_header(h, c)
{
    $('#header' + c.id).html(h);
}
function make_header(name)
{
    var s = get_head(name) + "<div style='padding-right:14px;display:inline;padding-left:20px;font-size:11px'>" + get_tail(name) + "</div>";
    return s;
}
function get_head(name)
{
    if(name.indexOf('&') >= 0)
    {
        if(name.slice(-1) === '/')
        {
            name = name.slice(0, -1)
        }
        fn = name.split('&').pop();
        fn = fn.split('/').pop();
    }
    else
    {
        fn = name.split('/').pop();
    }
    return fn;
}
function get_tail(name)
{
    if(name.indexOf('&') != -1)
    {
        fn = name.split('&').pop();
        fnn = name.split('&')[0];
        fg = fn.split('/').slice(0,-1).join('/');
        flj = '';
        if(fg != '')
        {
            flj = ':';
        }
        fn = fnn + flj + fg;

    }
    else
    {
        fn = name.split('/').slice(0,-1).join('/');      
    }
    return fn;
}
function get_editor()
{
    return current_container.editor;
}
function set_theme(name)
{
    theme = name;
    for(var i=0;i<containers.length;i++)
    {
        try
        {
            containers[i].editor.setTheme("ace/theme/" + name);
        }
        catch(err){}
    }
}
function clear_arrays()
{
    servers = [];
    files = [];
    opened_files = [];
}
function login()
{
    $.get('/login/',
        {
            username: $('#login_username').val(),
            password:$('#login_password').val()
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            loggedin = true;
            hide_menu();
            set_header('welcome ' + data['username'], current_container);
            username = data['username'];
            set_theme(data['theme'])
            clear_arrays();
            refresh();
            get_settings();
            return false;
        }
        return false;
    });
    return false;
}
function register()
{
    $.get('/register/',
        {
            username: $('#register_username').val(),
            password:$('#register_password').val(),
            email:$('#register_email').val()
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            loggedin = true;
            hide_menu();
            set_header('welcome ' + data['username'] + ', &nbsp;&nbsp;press ctrl + space to open the menu', current_container);
            username = data['username'];
            clear_arrays();
            refresh();
            get_settings();
            return false;
        }
        return false;
    });
    return false;
}
function show_theme_picker()
{
    s = template_theme_picker({themes:themes});
    set_menu(s);
}
function get_settings()
{
    $.get('/get_settings/',
        {
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            if(data['theme'])
            {   
                theme = data['theme'];
            }
            else
            {
                theme = 'tomorrow_night_eighties';   
            }
            if(data['editor_font_size'])
            {
                editor_font_size = data['editor_font_size'];
            }
            else
            {
                editor_font_size =  '18px';  
            }
            if(data['header_font_size'])
            {
                header_font_size = data['header_font_size'];
            }
            else
            {
                header_font_size = '18px';   
            }
            if(data['header_font_color'])
            {
                header_font_color = data['header_font_color'];
            }
            else
            {
                header_font_color = '#E6E6E6'; 
            }
            if(data['header_font_family'])
            {
                header_font_family = data['header_font_family'];
            }
            else
            {
                header_font_family = 'sans-serif'; 
            }
            if(data['header_background_color'])
            {
                header_background_color = data['header_background_color'];     
            }
            else
            {
                header_background_color = '#2D2D2D'; 
            }
            if(data['header_visible'])
            {
                header_visible = data['header_visible'];     
            }
            else
            {
                header_visible = 'yes'; 
            }
            if(data['autosave'])
            {
                autosave = data['autosave']
            }
            else
            {
                autosave = 'no'
            }
            if(data['show_gutter'])
            {
                show_gutter = data['show_gutter']
            }
            else
            {
                show_gutter = 'no'
            }
            if(data['show_line_numbers'])
            {
                show_line_numbers = data['show_line_numbers']
            }
            else
            {
                show_line_numbers = 'no'
            }
            if(data['keyboard_mode'])
            {
                keyboard_mode = data['keyboard_mode']
            }
            else
            {
                keyboard_mode = 'normal'
            }
            set_settings();
        }
        return false;
    });
    return false;     
}
function set_settings()
{
    set_theme(theme);
    $('.editor').css('font-size', editor_font_size);
    $('.header').css('font-size', header_font_size);
    $('.header').css('color', header_font_color);
    $('.header').css('font-family', header_font_family);
    $('.outer_header').css('background-color', header_background_color);
    if(header_visible == 'yes')
    {
        $('.outer_header').css('display', 'block');
    }
    else if(header_visible == 'no')
    {
        $('.outer_header').css('display', 'none');
    }
    set_keyboard_mode(keyboard_mode)
    for(i=0; i<containers.length; i++)
    {
        try
        {
            if(show_gutter === 'yes')
            {
                containers[i].editor.renderer.setShowGutter(true); 
            }
            else if(show_gutter === 'no')
            {
                containers[i].editor.renderer.setShowGutter(false); 
            }
        }
        catch(err)
        {
            continue;
        }
    }
    fix_height();
}
function change_theme(name)
{
    $.get('/change_theme/',
        {
            name:name
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
           set_theme(name);
           show_editor_settings();
        }
        return false;
    });
    return false; 
}
function logout()
{
    $.get('/logout/',
        {
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            window.location.reload();
        }
        return false;
    });
    return false;    
}        
function open_file(name, container)
{
    if(name=='')
    {
        return false;
    }
    var files = get_files();
    for(var i=0;i<files.length;i++)
    {
        if(files[i].name === name)
        {
            if(files[i].container !== container)
            {
                clone_file(files[i], container)
            }
            else
            {
                for(var i=0; i<files_to_open.length; i++)
                {
                    var f = files_to_open[i];
                    if(f.name === name && f.container === container)
                    {
                        files_to_open.splice(i, 1);
                        if(files_to_open.length > 0)
                        {
                            var nf = files_to_open[0];
                            open_file(nf.name, nf.container)
                        }
                        break;
                    }
                }
            }
            return false;
        }
    }
    if(name.indexOf('http://') !== -1)
    {
        open_url(name, container)
        return false;
    }
    hide_menu();
    name = name.replace("&amp;", "&");
    notify('loading file...');
    $.get('/open_file/',
        {
            name:name
        },
    function(data) 
    {
        if(data['status'] == 'ok')
        {
            file = load_file(data['name'], data['text'], container);
        }
        else
        {
            remove_file(name);
        }
        make_tabs(get_container(0));
        for(var i=0; i<files_to_open.length; i++)
        {
            var f = files_to_open[i];
            if(f.name === name && f.container === container)
            {
                files_to_open.splice(i, 1);
                if(files_to_open.length > 0)
                {
                    var nf = files_to_open[0];
                    open_file(nf.name, nf.container)
                }
                break;
            }
        }
        return false;
    });
    return false;    
}
function reload()
{
    name = current_container.file.name;
    if(name=='')
    {
        return false;
    }
    hide_menu();
    progress('loading...', current_container)
    name = name.replace("&amp;", "&");
    $.get('/open_file/',
        {
            name:name
        },
    function(data) 
    {
        make_tabs(current_container);
        if(data['status'] == 'ok')
        {
            reload_file(data);
        }
        return false;
    });
    return false;    
}
function reload_iframe(c)
{
    $('#iframe' + current_container).attr('src', current_container.url);
}
function get_container(id)
{
    for(var i=0;i<containers.length;i++)
    {
        if(containers[i].id == id)
        {
            return containers[i]
        }
    }
}
function remove_container(id)
{
    for(var i=0;i<containers.length;i++)
    {
        if(containers[i].id == id)
        {
            containers.splice(i,1);
        }
    }
}
function list_containers()
{
    for(var i=0;i<containers.length;i++)
    {
    }
}
function show_file_by_name(name)
{
    file = get_file_by_container(name, current_container)
    show_file(file);
}
function show_first_file_by_name(name)
{
    files = get_files();
    for(var i=0; i<files.length;i++)
    {
        if(files[i].name === name)
        {
            show_file(files[i]);
        }
    }
}
function get_first_file_by_name(name)
{
    files = get_files();
    for(var i=0; i<files.length;i++)
    {
        if(files[i].name === name)
        {
            return files[i];
        }
    }
    return false;
}
function get_files()
{
    var files = [];
    for(var i=0; i<containers.length;i++)
    {
        for(var j=0; j<containers[i].files.length; j++)
        {
            var file = containers[i].files[j]
            var store = true;
            for(var k=0; k<files.length; k++)
            {
                if(files[k].name === file.name)
                {
                    store = false;
                    break;
                }
            }
            if(store)
            {
                files.push(file);
            }
        }
    }
    return files;
}
function get_all_files()
{
    var files = [];
    for(var i=0; i<containers.length; i++)
    {
        files = files.concat(containers[i].files);
    }
    return files;
}
function show_file(file)
{
    current_container = file.container
    $('#container' + current_container.id).find('.iframe').each(function()
    {
        $(this).css('display', 'none')
    })
    if(file.name.indexOf('http://') !== -1)
    {
        $el = $("[id='iframe" + current_container.id + '-' + file.name + "']").css('display','block');
        $('#editor' + current_container.id).css('display','none');
        fix_height();
    }
    else
    {
        $('#editor' + current_container.id).css('display','block');
        fix_height();
    }
    current_container.file = file;
    set_title(get_head(file.name));
    make_tabs(current_container)
    current_container.editor.setSession(file.session);
    current_container.editor.focus();
    set_mode(file.name)
}
function prepare_file(name, text, container)
{
    file = new File();
    file.name = name;
    file.header = make_header(file.name);
    file.head = get_head(file.name);
    file.tail = get_tail(file.name);
    edit = new EditSession(text);
    edit.setUndoManager(new UndoManager());
    file.session = edit;
    file.container = container
    container.files.unshift(file);
    return file;
}
function load_file(name, text, container)
{
    if(name.substring(0,3) === 'new')
    {
        new_files += 1
        name = 'new' + new_files
    }
    file = prepare_file(name, text, container);
    container.editor.setSession(file.session);
    container.editor.focus();
    container.editor.scrollToRow(0);
    container.editor.clearSelection();
    set_mode(name);
    set_title(get_head(name));
    current_container.file = file;
    file.tokens = get_tokens();
    file.symbols = [];
    show_file(file);
    make_tabs(file.container);
    changetimer();
    sessiontimer();
    return file
}
function load_url_file(url, container)
{
    file = new File()
    file.name = url;
    file.head = url.replace('http://', '');
    file.tail = url;
    file.header = url;
    file.container = container;
    container.file = file;
    container.files.unshift(file)
    make_tabs(file.container)
    return
}
function UndoManagerProxy(undoManager, session) 
{
    this.$u = undoManager;
    this.$doc = session;
}

(function() {
    this.execute = function(options) {
        this.$u.execute(options);
    };

    this.undo = function() {
        var selectionRange = this.$u.undo(true);
        if (selectionRange) {
            this.$doc.selection.setSelectionRange(selectionRange);
        }
    };

    this.redo = function() {
        var selectionRange = this.$u.redo(true);
        if (selectionRange) {
            this.$doc.selection.setSelectionRange(selectionRange);
        }
    };

    this.reset = function() {
        this.$u.reset();
    };

    this.hasUndo = function() {
        return this.$u.hasUndo();
    };

    this.hasRedo = function() {
        return this.$u.hasRedo();
    };
}).call(UndoManagerProxy.prototype);

function clone_file(file, container)
{
    if(file.name.indexOf('http://') !== -1)
    {
        open_url(file.name, container);
        return false;
    }
    nf = new File();
    nf.name = file.name;
    nf.head = get_head(file.name);
    nf.tail = get_tail(file.name);
    nf.container = container;
    var session = new EditSession(file.session.getDocument(), get_mode(file.name));
    var undoManager = file.session.getUndoManager();
    var undoManagerProxy = new UndoManagerProxy(undoManager, session);
    session.setUndoManager(undoManagerProxy);
    session.$informUndoManager = lang.delayedCall(function() { session.$deltas = []; });
    nf.session = session;
    container.files.unshift(nf)
    container.file = nf
    container.editor.setSession(nf.session);
    nf.tokens = file.tokens;
    nf.symbols = file.symbols
    container.editor.focus();
    for(var i=0; i<files_to_open.length; i++)
    {
        var f = files_to_open[i];
        if(f.name === nf.name && f.container === nf.container)
        {
            files_to_open.splice(i, 1);
            if(files_to_open.length > 0)
            {
                var nff = files_to_open[0];
                open_file(nff.name, nff.container)
            }
            break;
        }
    }
    make_tabs(container);
    sessiontimer();
    return nf
}
function reload_file(data)
{
    for(var i=0;i<files.length;i++)
    {
        if(files[i].name == data['name'])
        {
            files[i].session.setValue(data['text']);
            get_editor().setSession(files[i].session);
            break;
        }
    }
    get_editor().focus();
    set_mode(data['name']);
    set_title(get_head(data['name']));
    current_container.file = get_file(data['name']);
    set_header(get_head(data['name']), current_container);
}
function set_mode(name)
{
    get_editor().getSession().setMode(get_mode(name));
    return false;
}
function get_mode(name)
{
    mode = 'textfile';
    extension = name.split(/[.]+/).pop();
    switch(extension)
    {
        case "html":
            mode = 'html';
            break;
        case "js":
            mode = 'javascript';
            break;
        case "py":
            mode = 'python';
            break;
        case "rb":
            mode = 'ruby';
            break;
        case "java":
            mode = "java";
            break;
        case "c":
            mode = "c_cpp"
            break;
        case "cpp":
            mode = "c_cpp"
            break;
        case "h":
            mode = "c_cpp"
            break;
        case "clj":
            mode = "clojure"
            break;
        case "css":
            mode = "css"
            break;
        case "cs":
            mode = "c_sharp"
            break;
        case "lsp":
            mode = "lisp"
            break;
        case "less":
            mode = "less"
            break;
        case "pl":
            mode = "perl"
            break;
        case "sql":
            mode = "sql"
            break;
        case "xml":
            mode = "xml"
            break;
        case "php":
            mode = "php"
            break;
        case "diff":
            mode = "diff"
            break;
        case "go":
            mode = "golang"
            break;
        case "lua":
            mode = "lua"
            break;
    }
    return 'ace/mode/' + mode
}


function displayKeyCode(evt)
{
    var textBox = getObject('txtChar');
    var charCode = (evt.which) ? evt.which : event.keyCode
    textBox.value = String.fromCharCode(charCode);
    if (charCode == 8) textBox.value = "backspace";
    if (charCode == 9) textBox.value = "tab";
    if (charCode == 13) textBox.value = "enter";
    if (charCode == 16) textBox.value = "shift";
    if (charCode == 17) textBox.value = "ctrl";
    if (charCode == 18) textBox.value = "alt";
    if (charCode == 19) textBox.value = "pause/break";
    if (charCode == 20) textBox.value = "caps lock";
    if (charCode == 27) textBox.value = "escape";
    if (charCode == 32) textBox.value = "space";
    if (charCode == 33) textBox.value = "page up";
    if (charCode == 34) textBox.value = "page down";
    if (charCode == 35) textBox.value = "end";
    if (charCode == 36) textBox.value = "home";
    if (charCode == 37) textBox.value = "left arrow";
    if (charCode == 38) textBox.value = "up arrow";
    if (charCode == 39) textBox.value = "right arrow";
    if (charCode == 40) textBox.value = "down arrow";
    if (charCode == 45) textBox.value = "insert";
    if (charCode == 46) textBox.value = "delete";
    if (charCode == 91) textBox.value = "left winkey";
    if (charCode == 92) textBox.value = "right winkey";
    if (charCode == 93) textBox.value = "select key";
    if (charCode == 96) textBox.value = "numpad 0";
    if (charCode == 97) textBox.value = "numpad 1";
    if (charCode == 98) textBox.value = "numpad 2";
    if (charCode == 99) textBox.value = "numpad 3";
    if (charCode == 100) textBox.value = "numpad 4";
    if (charCode == 101) textBox.value = "numpad 5";
    if (charCode == 102) textBox.value = "numpad 6";
    if (charCode == 103) textBox.value = "numpad 7";
    if (charCode == 104) textBox.value = "numpad 8";
    if (charCode == 105) textBox.value = "numpad 9";
    if (charCode == 106) textBox.value = "multiply";
    if (charCode == 107) textBox.value = "add";
    if (charCode == 109) textBox.value = "subtract";
    if (charCode == 110) textBox.value = "decimal point";
    if (charCode == 111) textBox.value = "divide";
    if (charCode == 112) textBox.value = "F1";
    if (charCode == 113) textBox.value = "F2";
    if (charCode == 114) textBox.value = "F3";
    if (charCode == 115) textBox.value = "F4";
    if (charCode == 116) textBox.value = "F5";
    if (charCode == 117) textBox.value = "F6";
    if (charCode == 118) textBox.value = "F7";
    if (charCode == 119) textBox.value = "F8";
    if (charCode == 120) textBox.value = "F9";
    if (charCode == 121) textBox.value = "F10";
    if (charCode == 122) textBox.value = "F11";
    if (charCode == 123) textBox.value = "F12";
    if (charCode == 144) textBox.value = "num lock";
    if (charCode == 145) textBox.value = "scroll lock";
    if (charCode == 186) textBox.value = ";";
    if (charCode == 187) textBox.value = "=";
    if (charCode == 188) textBox.value = ",";
    if (charCode == 189) textBox.value = "-";
    if (charCode == 190) textBox.value = ".";
    if (charCode == 191) textBox.value = "/";
    if (charCode == 192) textBox.value = "`";
    if (charCode == 219) textBox.value = "[";
    if (charCode == 220) textBox.value = "\\";
    if (charCode == 221) textBox.value = "]";
    if (charCode == 222) textBox.value = "'";

    var lblCharCode = getObject('spnCode');
    lblCharCode.innerHTML = '&nbsp;&nbsp;&nbsp;code:  ' + charCode;
    return false;

}
function getObject(obj)
{
  var theObj;
  if (document.all) 
  {
      if (typeof obj=='string') 
      {
          return document.all(obj);
      } else {
          return obj.style;
      }
  }
  if (document.getElementById) 
  {
      if (typeof obj=='string') 
      {
          return document.getElementById(obj);
      } else {
          return obj.style;
      }
  }
  return null;
}
function make_tabs(container)
{
    t = template_tabs({files:container.files, current:container.file.name})
    $('#header' + container.file.container.id).html(t);
    $('.tab').each(function()
    {
        $(this).click(function(e)
        {
            var name = $(this).attr('title')
            if(e.which == 1)
            {
                if($(this).hasClass('selected_tab'))
                {
                    show_main_menu()
                }
                else
                {
                    show_file_by_name(name);
                }
            }
            if(e.which == 2)
            {
                var file = get_file_by_container(name,current_container);
                close_file(file);
                e.preventDefault();
            }
            return false;
        })
    })
}
function notify(msg)
{
    $('#header0').html(msg);
}
function make_all_tabs()
{
    for(var i=0; i<containers.length; i++)
    {
        make_tabs(containers[i]);
    }
}
function get_container_files(container)
{
    var dfiles = [];
    for(var i=0; i<files.length; i++)
    {
        if(files[i].container === container)
        {
            dfiles.push(files[i]);
        }
    }
    return dfiles;
}
function new_file(container)
{
    file = load_file('new', '', container);
    make_tabs(container)
    return file;
}
function set_keyboard_mode(mode)
{
    if(mode === "normal")
    {
        for(i=0; i<containers.length; i++)
        {
            try
            {
                containers[i].editor.setKeyboardHandler("ace/keyboard/textinput");
            }
            catch(err)
            {
                continue;
            }
        }
    }
    if(mode === "vim")
    {
        for(i=0; i<containers.length; i++)
        {
            try
            {
                containers[i].editor.setKeyboardHandler("ace/keyboard/vim");
            }
            catch(err)
            {
                continue;
            }
        }
    }
    if(mode === "emacs")
    {
         for(i=0; i<containers.length; i++)
        {
            try
            {
                containers[i].editor.setKeyboardHandler("ace/keyboard/emacs");
            }
            catch(err)
            {
                continue;
            }
        }
    }
}

function get_cursor()
{
    return get_editor().selection.getCursor();
}

function get_token_at_cursor()
{
    var cursor = get_cursor();
    token = get_editor().session.getTokenAt(cursor.row, (cursor.column) );
    return token;
}

function get_cursor_coordinates()
{
    cursor = get_cursor();
    pos = get_editor().renderer.textToScreenCoordinates(cursor.row, cursor.column);
    return pos
}

function get_line_height()
{
    return get_editor().renderer.lineHeight;
}

function start_suggestions()
{
    t = template_suggestions();
    $('body').append(t);
    $('.suggestions_holder').css('display','none'); 
}

function load_suggestions_handler()
{
    suggestions_handler = new HashHandler()
    suggestions_handler.bindKeys({"Up": function(ed)
    {
        suggestion_selected_up();
    }})
    suggestions_handler.bindKeys({"Down": function(ed)
    {
        suggestion_selected_down();
    }})
    suggestions_handler.bindKeys({"Enter": function(ed)
    {
        suggestion_selected_enter();
    }})
    get_editor().keyBinding.addKeyboardHandler(suggestions_handler)
}

function suggestion_selected_up()
{
    sel = $('.suggestion_item_selected')
    prev = sel.prev('.suggestion_item')
    if(prev.length > 0)
    {
        prev.attr('class', 'suggestion_item_selected');
        sel.attr('class', 'suggestion_item');
    }
    var selpos = $('.suggestion_item_selected').position();
    var height = $('.suggestions_holder').height();
    if(selpos.top < 10)
    {
        $('.suggestions_holder').scrollTop($('.suggestions_holder').scrollTop() - 20)
    }

}
function suggestion_selected_down()
{
    sel = $('.suggestion_item_selected')
    var next = sel.next('.suggestion_item')
    if(next.length > 0)
    {
        next.attr('class', 'suggestion_item_selected');
        sel.attr('class', 'suggestion_item');
    }
    var selpos = $('.suggestion_item_selected').position();
    var height = $('.suggestions_holder').height();
    if(selpos.top > height * 0.8)
    {
        $('.suggestions_holder').scrollTop($('.suggestions_holder').scrollTop() + 20)
    }
}

function suggestion_selected_enter()
{
    pos = get_cursor();
    get_editor().selection.selectWord();
    suggestion = $('.suggestion_item_selected').html()
    get_editor().insert(suggestion)
    token = suggestion;
    hide_suggestions();
}

function show_suggestions()
{
    try
    {
        token = get_token_at_cursor()['value'].replace(/ +/g, '');
    }
    catch(err)
    {
        hide_suggestions();
        return false;
    }
    if(token === '')
    {
        hide_suggestions();
        return false;
    }
    if(token === null)
    {
        hide_suggestions();
        return false;
    }
    suggestions = get_suggestions(token);
    if(suggestions.length == 0)
    {
        hide_suggestions();
        return false;
    }
    if($('.suggestions_holder').css('display') === 'block')
    {
        update_suggestions(suggestions);
        return false;
    }
    update_suggestions(suggestions);
    pos = get_cursor_coordinates();
    if(($('body').width() - pos.pageX) < 230)
    {
        $('.suggestions_holder').css('left', (pos.pageX - 150) + 'px')
    }
    else
    {
        $('.suggestions_holder').css('left', pos.pageX + 'px')
    }
    $('.suggestions_holder').css('display', 'block');
    $('.suggestions_holder').css('font-size', editor_font_size);
    load_suggestions_handler();
}

function get_suggestions()
{
    var suggestions = []
    for(i=0; i<current_container.file.tokens.length; i++)
    {
        if(current_container.file.tokens[i].indexOf(token) > -1)
        {
            suggestions.push(current_container.file.tokens[i])
        }
    }
    return suggestions;
}

function update_suggestions(suggestions)
{
    if(suggestions.length == 0)
    {
        hide_suggestions();
        return false;
    }
    t = template_suggestion_items({suggestions:suggestions})
    $('.suggestions').html(t);
    pos = get_cursor_coordinates();
    if(($('body').height() - pos.pageY) < (get_line_height() * 9))
    {
        var sh = $('.suggestions_holder').height();
        $('.suggestions_holder').css('top', (pos.pageY - sh - (get_line_height() * 0.3)) + 'px')
    }
    else
    {
        $('.suggestions_holder').css('top', (pos.pageY + get_line_height() * 1.3)+ 'px')
    }
}

function save_token(token)
{
    add = true;
    for(var i=0; i < current_container.file.tokens.length; i++)
    {
        if(current_container.file.tokens[i] === token)
        {
            add = false;
        }
    }
    if(add)
    {
        current_container.file.tokens.unshift(token);
    }
}

function hide_suggestions()
{
    try
    {
        get_editor().keyBinding.removeKeyboardHandler(suggestions_handler)
    }
    catch(err)
    {

    }
    $('.suggestions_holder').css('display', 'none')
}

function get_tokens()
{
    wordlist = [];
    num_lines = get_editor().session.getLength();
    for(l=0; l<num_lines; l++)
    {
        try
        {
            line = get_editor().session.getTokens(l)[0]['value'];
        }
        catch(err)
        {
            continue;
        }
        line = line.replace(/[^A-Za-z_-]/g, ' ')
        words = line.split(/[ ]+/);
        for(var i=0; i<words.length; i++)
        {
            if(words[i] == '')
            {
                continue;
            }
            repeated = false;
            for(var j=0; j<wordlist.length; j++)
            {
                if(wordlist[j] === words[i])
                {
                    repeated = true;
                    break;
                }
            }
            if(repeated)
            {
                continue;
            }
            if(words[i].length < 4)
            {
                continue;
            }
            wordlist.push(words[i]);
        }
        
    }
    return wordlist;
}

function Symbol(value, row)
{
    this.value = value;
    this.row = row;
}

function get_symbols(file)
{
    if(file.name.indexOf('http://') !== -1)
    {
        return false;
    }
    symbols = [];
    num_lines = file.session.getLength();
    for(var l=0; l<num_lines; l++)
    {
        try
        {
            tokens = file.session.getTokens(l);
            for(var j=0; j<tokens.length; j++)
            {
                if(tokens[j]['type'] === 'entity.name.function')
                {
                    s = new Symbol(tokens[j]['value'], l)
                    symbols.push(s);
                }
            }
        }
        catch(err)
        {
            continue;
        }
    }
    var files = get_all_files();
    for(var i=0; i<files.length; i++)
    {
        if(files[i].name === file.name)
        {
            files[i].symbols = symbols;
        }
    }
}

function start_symbols()
{
    t = template_symbols();
    $('body').append(t);
    $('.symbols_holder').css('display','none'); 
    $('.symbols_input').keydown(function(e)
    {
        code = (e.keyCode ? e.keyCode : e.which)
        if(code == 38)
        {
            symbol_selected_up();
            e.preventDefault();
        }
        else if(code == 40)
        {
            symbol_selected_down();
            e.preventDefault();
        }
        else if(code == 13)
        {
            symbol_selected_enter();
            e.preventDefault();
        }
        else
        {
            update_symbols();
        }
    });
}

function show_symbols()
{
    $('.symbols_holder').css('display', 'block')
    $('.symbols_input').focus();
    var matches = match_symbols('');
    t = template_symbol_items({symbols:matches})
    $('.symbols').html(t);
    $('.symbols').css('max-height', '6em');
}

function match_symbols(input)
{
    var matches = []
    for(var i=0; i<current_container.file.symbols.length; i++)
    {
        try
        {
            if(input === '' || current_container.file.symbols[i].value.indexOf(input) != -1)
            {
                matches.push(current_container.file.symbols[i]);
            }
        }
        catch(err)
        {
            continue;
        }
    }
    return matches;
}

function hide_symbols()
{
    $('.symbols_holder').css('display', 'none');
    $('.symbols_input').val('')

    get_editor().focus();
}

function update_symbols()
{
    var input = $('.symbols_input').val();
    var matches = match_symbols(input);
    t = template_symbol_items({symbols:matches})
    $('.symbols').html(t);
    $('.symbols').css('max-height', '6em');
}

function symbol_selected_up()
{
    sel = $('.symbol_item_selected')
    prev = sel.prev('.symbol_item')
    if(prev.length > 0)
    {
        prev.attr('class', 'symbol_item_selected');
        sel.attr('class', 'symbol_item');
    }
    var selpos = $('.symbol_item_selected').position();
    var height = $('.symbols').height();
    if(selpos.top < 20)
    {
        $('.symbols').scrollTop($('.symbols').scrollTop() - 20)
    }

}
function symbol_selected_down()
{
    try
    {
        var sel = $('.symbol_item_selected');
        var next = sel.next('.symbol_item');
        if(next.length > 0)
        {
            next.attr('class', 'symbol_item_selected');
            sel.attr('class', 'symbol_item');
        }
        var selpos = $('.symbol_item_selected').position();
        var height = $('.symbols').height();
        if(selpos.top > height * 1.1)
        {
            $('.symbols').scrollTop($('.symbols').scrollTop() + 20)
        }
    }
    catch(err)
    {
    }
    return false;
}

function symbol_selected_enter()
{
    hide_symbols();
    row = parseInt($('.symbol_item_selected').attr('id'))
    get_editor().gotoLine(row + 1)
}

function show_overlay()
{
    $('#menu_overlay').css('visibility', 'visible')
    $('#loading_animation').css('visibility', 'visible')
}

function hide_overlay()
{
    $('#menu_overlay').css('visibility', 'hidden')
    $('#loading_animation').css('visibility', 'hidden')
}