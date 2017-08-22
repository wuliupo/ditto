var ditto = {
    // page element ids
    content_id: "#content",
    sidebar_id: "#sidebar",
    toggleSidebar_id: "#toggleSide",
    edit_id: "#edit",
    back_to_top_id: "#back_to_top",
    loading_id: "#loading",
    error_id: "#error",

    // display elements
    sidebar: true,
    edit_button: true,
    back_to_top_button: true,
    save_progress: true, // 保存阅读进度
    search_bar: true,
    menu_collapse: true,  // 菜单折叠
    document_title: document.title,

    // initialize function
    run: initialize
};

/**
 * 获取当前hash
 *
 * @param {string} hash 要解析的hash，默认取当前页面的hash，如： nav#类目 => {nav:nav, anchor:类目}
 * @description 分导航和页面锚点
 * @return {Object} {nav:导航, anchor:页面锚点}
 */
var getHash = function (hash) {
  hash = hash || window.location.hash.substr(1);

  if (!hash) {
    return {
      nav: '',
      anchor: ''
    }
  }

  hash = hash.split('#');
  return {
    nav: hash[0],
    anchor: decodeURIComponent(hash[1] || '')
  }
};

var menu = [];

function initialize() {
   $(document.body).append('<div id="sidebar"></div><div id="content"></div><div id="loading">Loading ...</div><div id="error">Opps! ... File not found!</div><div id="flip"><div id="back_to_top" class="pull-right">back to top</div><div id="edit" class="pull-right">edit</div><div id="pageup">上一章</div><div id="pagedown">下一章</div><div id="toggleSide">菜单</div></div><div class="progress-indicator-2"></div>');

   $('<button class="toggle-sidebar">&lt;&gt;</button>').appendTo(document.body).click(function(){
     $(document.body).toggleClass('hide-sidebar');
   });

  // initialize sidebar and buttons
  if (ditto.sidebar) {
    init_sidebar_section();
  }

  if (ditto.back_to_top_button) {
    init_back_to_top_button();
  }

  if (ditto.edit_button) {
    init_edit_button();
  }

  $(ditto.toggleSidebar_id).click(function(){
      $(ditto.sidebar_id).toggle();
  });

  // page router
  router();
  $(window).on('hashchange', router);
}

function init_menu_collapse() {
  var sidebar = $('#sidebar').on('click', 'ol li', function(e) {e.stopPropagation(); sidebar.removeClass('close'); $(this).toggleClass('close')}).on('click', 'h2', function(e) {e.stopPropagation(); sidebar.toggleClass('close');});
}

function init_sidebar_section() {
    $.get(ditto.sidebar_file, function (data) {
        $(ditto.sidebar_id).html(marked(data));

        if (ditto.search_bar) {
           init_searchbar();
        }

        if (ditto.menu_collapse) {
          init_menu_collapse();
        }

        // 初始化内容数组
        $(ditto.sidebar_id + ' ol').attr('start', 1).find('li a').each(function() {
            menu.push(this.href.slice(this.href.indexOf('#')));
        });
        $('#pageup, #pagedown').click(function() {
            var hash = getHash().nav;
            for (var i = 0; i < menu.length; i++) {
                if (hash === '' || menu[i] === '#' + hash) break;
            }
            this.id === 'pagedown' ? i++ : i--;
            location.hash = menu[i >= menu.length || this.id < 0 ? 0 : i];
        });
    }, "text").fail(function() {
        alert("Opps! can't find the sidebar file to display!");
    });
}

var isSearching = false, lastSearchVal;
function ontime_search(input) {
  if (isSearching) {
    return;
  }
  var value = (input.value + '').replace(/\W+/g, '');
  if (value === lastSearchVal) {
    return;
  }
  var links = $('#sidebar').find('li').find('a'), ols = $('#sidebar').find('ol');
  if (!value) {
    ols.find('li').removeClass('hide');
    links.removeClass('hide');
    return;
  }
  lastSearchVal = value;
  isSearching = true;
  links.each(function() {
    var a = $(this), parent = a.parent('li');
    if (a.attr('href').indexOf(value) > -1 || a.text().indexOf(value) > -1) {
      parent.removeClass('hide');
    } else {
      parent.addClass('hide');
    }
  });
  ols.each(function() {
    var ol = $(this), parent = ol.parent('li');
    if (ol.children().length !== ol.children('.hide').length) {
      parent.removeClass('hide');
    } else {
      parent.addClass('hide');
    }
  });
  isSearching = false;
  ontime_search(input);
}

function init_searchbar() {
  var search = '<form class="searchBox" onSubmit="return searchbar_listener()"><input type="search" onkeyup="ontime_search(this)"  onchange="ontime_search(this)" ><button type="submit" alt="Search">🔍</button></form>';
  var sidebar = $(ditto.sidebar_id);
  var header = sidebar.find('h2');
  if (header.length) {
    header.first().before(search);
  } else {
    header = sidebar.find('h1');
    if (header.length) {
      header.first().after(search);
    } else {
      sidebar.prepend(search);
    }
  }
}

function searchbar_listener(event) {
    // event.preventDefault();
    var q = $('.searchBox input').val();
    if (q !== '') {
      window.open(ditto.git_url + '/search?utf8=✓&q=' + encodeURIComponent(q), '_blank');
      win.focus();
    }
    return false;
}


function init_back_to_top_button() {
  $(ditto.back_to_top_id).show().click(goTop);
}

function goTop(e) {
  if(e) e.preventDefault();
  $('html, body').animate({
    scrollTop: 0
  }, 200);
  history.pushState(null, null, '#' + (location.hash.split('#')[1] || ''));
}

function goSection(sectionId){
  $('html, body').animate({
    scrollTop: ($('#' + sectionId).offset().top)
  }, 300);
}

function init_edit_button() {
  if (ditto.base_url === null) {
    alert("Error! You didn't set 'base_url' when calling ditto.run()!");
  } else {
    $(ditto.edit_id).show().click(function() {
      var hash = location.hash.replace("#", "/");
      if (/#.*$/.test(hash)) {
        hash = hash.replace(/#.*$/, '');
      }
      if (hash === "") {
        hash = "/" + ditto.index.replace(".md", "");
      }

      window.open(ditto.base_url + hash + ".md");
      // open is better than redirecting, as the previous page history
      // with redirect is a bit messed up
    });
  }
}

function replace_symbols(text) {
  // replace symbols with underscore
  return text
    .replace(/, /g, ',')
    .replace(/[&\/\\#,.+=$~%'":*?<>{}\ \]\[]/g, "-")
    .replace(/[()]/g, '');
}

function li_create_linkage(li_tag, header_level) {
  // add custom id and class attributes
  html_safe_tag = replace_symbols(li_tag.text());
  li_tag.attr('data-src', html_safe_tag).attr("class", "link").click(function(e) {
    // add click listener - on click scroll to relevant header section
    e.preventDefault();
    var target = '#' + li_tag.attr('data-src');
    // scroll to relevant section
    var header = $(ditto.content_id + " h" + header_level + target);
    if (!header.length) {
      return;
    }
    $('html, body').animate({
      scrollTop: header.offset().top
    }, 200);

    // highlight the relevant section
    original_color = header.css("color");
    header.animate({ color: "#ED1C24", }, 500, function() {
      // revert back to orig color
      $(this).animate({color: original_color}, 2500);
    });
    history.pushState(null, null, '#' + location.hash.split('#')[1] + target);
  });
}

function create_page_anchors() {
  // create page anchors by matching li's to headers
  // if there is a match, create click listeners
  // and scroll to relevant sections

  // go through header level 1 to 3
  for (var i = 2; i <= 4; i++) {
    // parse all headers
    var headers = [];
    $('#content h' + i).map(function() {
      var content = $(this).text(), title = replace_symbols(content);
      headers.push(content);
      $(this).attr('id', title).hover(function () {
        $(this).html(content +
          ' <a href="#' + location.hash.split('#')[1] +
          '#' +
          title +
          '" class="section-link">§</a> <a href="#' +
          location.hash.split('#')[1] + '" onclick="goTop()">⇧</a>');
      }, function () {
        $(this).html(content);
      }).on('click', 'a.section-link', function(event) {
        event.preventDefault();
        history.pushState(null, null, '#' + location.hash.split('#')[1] + '#' + title);
        goSection(title);
      });
    });

    if ((i === 2) && headers.length !== 0) {
      var ul_tag = $('<ol></ol>')
        .insertAfter('#content h1')
        .addClass('content-toc')
        .attr('id', 'content-toc');
      for (var j = 0; j < headers.length; j++) {
        li_create_linkage($('<li><a href="#' + location.hash.split('#')[1] + '#' + headers[j] + '">' + headers[j] + '</a></li>').appendTo(ul_tag), i);
      }
    }
  }
}

function normalize_paths() {
  // images
  $(ditto.content_id + " img").map(function() {
    var src = $(this).attr("src").replace("./", "");
    if ($(this).attr("src").slice(0, 4) !== "http") {
      var pathname = location.pathname.substr(0, location.pathname.length - 1);
      var url = location.hash.replace("#", "").split("/"); // split and extract base dir
      var base_dir = url.slice(0, url.length - 1).toString();

      // normalize the path (i.e. make it absolute)
      $(this).attr("src", pathname + base_dir + "/" + src);
    }
  });
}

function show_error() {
  console.log("SHOW ERORR!");
  $(ditto.loading_id).hide()
  $(ditto.error_id).show();
}

function show_loading() {
  var loading = $(ditto.loading_id).show();  // clear content
  $(ditto.content_id).html('');

  $(ditto.sidebar_id).css('display', '');

  // infinite loop until clearInterval() is called on loading
  return setInterval(function() {
    loading.fadeIn(1000).fadeOut(1000);
  }, 2000);
}

function router() {
  var path = location.hash.replace(/#([^#]*)(#.*)?/, './$1');

  var hashArr = location.hash.split('#');
  var sectionId;
  if (hashArr.length > 2 && !(/^comment-/.test(hashArr[2]))) {
    sectionId = hashArr[2];
  }

  if (ditto.save_progress && store.get('menu-progress') !== location.hash) {
    store.set('menu-progress', location.hash);
    store.set('page-progress', 0);
  }

  // default page if hash is empty
  if (location.pathname === "/index.html") {
    path = location.pathname.replace("index.html", ditto.index);
    normalize_paths();
  } else if (!path) {
    path = location.pathname + ditto.index;
    normalize_paths();
  } else {
    path += ".md";
  }

  // 取消scroll事件的监听函数
  // 防止改变下面的变量perc的值
  $(window).off('scroll');

  // otherwise get the markdown and render it
  var loading = show_loading();
  $.get(path, function(data) {
    $(ditto.error_id).hide();
    if (data.indexOf('title: ') > 0) {
        data = data.replace('---', '```').replace('---', '```');
        // TODO regexp
        var title = data.indexOf('title: ') > 0 ? data.substring(data.indexOf('title: ') + 7, data.indexOf('layout: ')) : 'Content';
        data = '# ' + title + '\n\n' + data;
    }
    var content = $(ditto.content_id);
    var h1 = content.html(marked(data)).find('h1');
    if (!h1.length) {
      h1 = $('<h1>' + hashArr[1] + '</h1>').prependTo(content);
    }
    if (h1.text() === ditto.document_title) {
      document.title = ditto.document_title;
    } else {
      document.title = h1.text() + " - " + ditto.document_title;
    }
    normalize_paths();
    create_page_anchors();

    // 完成代码高亮
    content.find('code').map(function() {
      Prism.highlightElement(this);
    });

    var perc = ditto.save_progress && store.get('page-progress') || 0;

    if (sectionId) {
      $('html, body').animate({
        scrollTop: ($('#' + decodeURI(sectionId)).offset().top)
      }, 300);
    } else if (location.hash !== '' || Boolean(perc)) {
      if (!Boolean(perc)) {
        $('html, body').animate({
          scrollTop: (content.offset().top)
        }, 300);
      } else {
        $('html, body').animate({
          scrollTop: (content.height()-$(window).height())*perc
        }, 200);
      }
    }
    $('#pageup').css('display', location.hash === '' || '#' + getHash().nav === menu[0] ? 'none' : 'inline-block');
    $('#pagedown').css('display', '#' + getHash().nav === menu[(menu.length - 1)] ? 'none' : 'inline-block');

    (function() {
      var $w = $(window);
      var $prog2 = $('.progress-indicator-2');
      var sHeight = $('body').height() - $w.height();
      $w.scroll(function() {
        window.requestAnimationFrame(function(){
          updateProgress(Math.max(0, Math.min(1, $w.scrollTop() / sHeight)));
        });
      });

      function updateProgress(perc) {
        $prog2.css({width: perc * 100 + '%'});
        ditto.save_progress && store.set('page-progress', perc);
      }

    }());

  }).fail(show_error).always(function() {
    clearInterval(loading);
    $(ditto.loading_id).hide();
  });
}
