// Dean Attali / Beautiful Jekyll 2016

// This `isOnScreen` function comes from:
// https://stackoverflow.com/a/35435672
$.fn.isOnScreen = function(partial) {

  //let's be sure we're checking only one element (in case function is called on set)
  var t = $(this).first();

  //we're using getBoundingClientRect to get position of element relative to viewport
  //so we dont need to care about scroll position
  var box = t[0].getBoundingClientRect();

  //let's save window size
  var win = {
    h: $(window).height(),
    w: $(window).width()
  };

  //now we check against edges of element

  //firstly we check one axis
  //for example we check if left edge of element is between left and right edge of scree (still might be above/below)
  var topEdgeInRange = box.top >= 0 && box.top <= win.h;
  var bottomEdgeInRange = box.bottom >= 0 && box.bottom <= win.h;

  var leftEdgeInRange = box.left >= 0 && box.left <= win.w;
  var rightEdgeInRange = box.right >= 0 && box.right <= win.w;


  //here we check if element is bigger then window and 'covers' the screen in given axis
  var coverScreenHorizontally = box.left <= 0 && box.right >= win.w;
  var coverScreenVertically = box.top <= 0 && box.bottom >= win.h;

  //now we check 2nd axis
  var topEdgeInScreen = topEdgeInRange && (leftEdgeInRange || rightEdgeInRange || coverScreenHorizontally);
  var bottomEdgeInScreen = bottomEdgeInRange && (leftEdgeInRange || rightEdgeInRange || coverScreenHorizontally);

  var leftEdgeInScreen = leftEdgeInRange && (topEdgeInRange || bottomEdgeInRange || coverScreenVertically);
  var rightEdgeInScreen = rightEdgeInRange && (topEdgeInRange || bottomEdgeInRange || coverScreenVertically);

  //now knowing presence of each edge on screen, we check if element is partially or entirely present on screen
  var isPartiallyOnScreen = topEdgeInScreen || bottomEdgeInScreen || leftEdgeInScreen || rightEdgeInScreen;
  var isEntirelyOnScreen = topEdgeInScreen && bottomEdgeInScreen && leftEdgeInScreen && rightEdgeInScreen;

  return partial ? isPartiallyOnScreen : isEntirelyOnScreen;

};

$.expr.filters.onscreen = function(elem) {
  return $(elem).isOnScreen(true);
};

$.expr.filters.entireonscreen = function(elem) {
  return $(elem).isOnScreen(false);
};

var main = {

  bigImgEl: null,
  numImgs: null,

  init: function() {
    // Shorten the navbar after scrolling a little bit down
    // $(window).scroll(function() {
    //     if ($(".navbar").offset().top > 50) {
    //         $(".navbar").addClass("top-nav-short");
    //     } else {
    //         $(".navbar").removeClass("top-nav-short");
    //     }
    // });

    // On mobile, hide the avatar when expanding the navbar menu
    $('#main-navbar').on('show.bs.collapse', function() {
      $(".navbar").addClass("top-nav-expanded");
    });
    $('#main-navbar').on('hidden.bs.collapse', function() {
      $(".navbar").removeClass("top-nav-expanded");
    });

    // On mobile, when clicking on a multi-level navbar menu, show the child links
    $('#main-navbar').on("click", ".navlinks-parent", function(e) {
      var target = e.target;
      $.each($(".navlinks-parent"), function(key, value) {
        if (value == target) {
          $(value).parent().toggleClass("show-children");
        } else {
          $(value).parent().removeClass("show-children");
        }
      });
    });

    $('.level-3-menu').on("mouseenter", function(e) {
      let target = e.currentTarget;
      let submenu = $(target).children('.navlinks-children');
      console.log(submenu.isOnScreen(false));
      if (!submenu.isOnScreen(false)) {
        submenu[0].style.left = "-100%";
        submenu.addClass("left-menu");
        submenu.removeClass("right-menu");
      }
    });

    $('.level-3-menu').on("mouseleave", function(e) {
      let target = e.currentTarget;
      let submenu = $(target).children('.navlinks-children');
      submenu[0].style.left = "100%";
    });

    // Ensure nested navbar menus are not longer than the menu header
    var menus = $(".nav > .navlinks-container");
    if (menus.length > 0) {
      var navbar = $($("#main-navbar").find("ul")[0]);
      var fakeMenuHtml = "<li class='fake-menu' style='display:none;'><a></a></li>";
      navbar.append(fakeMenuHtml);
      var fakeMenu = $(".fake-menu");

      $.each(menus, function(i) {
        var parent = $(menus[i]).find(".navlinks-parent");
        var children = $(menus[i]).find(".navlinks-children a");
        var words = [];
        $.each(children, function(idx, el) { words = words.concat($(el).text().trim().split(/\s+/)); });
        var maxwidth = 0;
        $.each(words, function(id, word) {
          fakeMenu.html("<a>" + word + "</a>");
          var width = fakeMenu.width();
          if (width > maxwidth) {
            maxwidth = width;
          }
        });
        $(menus[i]).css('min-width', maxwidth + 'px')
      });

      fakeMenu.remove();
    }

    // show the big header image
    main.initImgs();
  },

  initImgs: function() {
    // If the page was large images to randomly select from, choose an image
    if ($("#header-big-imgs").length > 0) {
      main.bigImgEl = $("#header-big-imgs");
      main.numImgs = main.bigImgEl.attr("data-num-img");

      // 2fc73a3a967e97599c9763d05e564189
      // set an initial image
      var imgInfo = main.getImgInfo();
      var src = imgInfo.src;
      var desc = imgInfo.desc;
      var position = imgInfo.position;
      main.setImg(src, desc, position);

      // For better UX, prefetch the next image so that it will already be loaded when we want to show it
      var getNextImg = function() {
        var imgInfo = main.getImgInfo();
        var src = imgInfo.src;
        var desc = imgInfo.desc;
        var position = imgInfo.position;

        var prefetchImg = new Image();
        prefetchImg.src = src;
        // if I want to do something once the image is ready: `prefetchImg.onload = function(){}`

        setTimeout(function() {
          var img = $("<div></div>").addClass("big-img-transition").css("background-image", 'url(' + src + ')');
          if (position !== undefined) {
            img.css("background-position", position);
          }
          $(".intro-header.big-img").prepend(img);
          setTimeout(function() { img.css("opacity", "1"); }, 50);

          // after the animation of fading in the new image is done, prefetch the next one
          //img.one("transitioned webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
          setTimeout(function() {
            main.setImg(src, desc, position);
            img.remove();
            getNextImg();
          }, 1000);
          //});
        }, 6000);
      };

      // If there are multiple images, cycle through them
      if (main.numImgs > 1) {
        getNextImg();
      }
    }
  },

  getImgInfo: function() {
    var randNum = Math.floor((Math.random() * main.numImgs) + 1);
    var src = main.bigImgEl.attr("data-img-src-" + randNum);
    var desc = main.bigImgEl.attr("data-img-desc-" + randNum);
    var position = main.bigImgEl.attr("data-img-position-" + randNum);

    return {
      src: src,
      desc: desc,
      position: position
    }
  },

  setImg: function(src, desc, position) {
    $(".intro-header.big-img").css("background-image", 'url(' + src + ')');
    if (position !== undefined) {
      $(".intro-header.big-img").css("background-position", position);
    }
    else {
      // Remove background-position if added to the prev image.
      $(".intro-header.big-img").css("background-position", "");
    }
    if (typeof desc !== typeof undefined && desc !== false) {
      // Check for Markdown link
      var mdLinkRe = /\[(.*?)\]\((.+?)\)/;
      if (desc.match(mdLinkRe)) {
        // Split desc into parts, extracting md links
        var splitDesc = desc.split(mdLinkRe);

        // Build new description
        var imageDesc = $(".img-desc");
        splitDesc.forEach(function(element, index) {
          // Check element type. If links every 2nd element is link text, and every 3rd link url
          if (index % 3 === 0) {
            // Regular text, just append it
            imageDesc.append(element);
          }
          if (index % 3 === 1) {
            // Link text - do nothing at the moment
          }
          if (index % 3 === 2) {
            // Link url - Create anchor tag with text
            var link = $("<a>", {
              "href": element,
              "target": "_blank",
              "rel": "noopener noreferrer"
            }).text(splitDesc[index - 1]);
            imageDesc.append(link);
          }
        });
        imageDesc.show();
      } else {
        $(".img-desc").text(desc).show();
      }
    } else {
      $(".img-desc").hide();
    }
  }
};

// 2fc73a3a967e97599c9763d05e564189

document.addEventListener('DOMContentLoaded', main.init);

var headerResizer = {
  headerEle: null,
  contentEle: null,
  tocEle: null,
  body: null,
  main: null,
  inited: false,
  updateMargin: function() {
    if (!this.inited) {
      this.headerEle = document.getElementById("navbar");
      this.contentEle = document.getElementById("intro-header");
      this.tocEle = document.getElementById("toc");
      this.body = document.body;
      this.main = document.getElementById("mainContainer")
    }
    if (this.contentEle != null && this.headerEle != null) {
      const height = this.headerEle.offsetHeight;
      if (this.contentEle.className.includes("big-img")) {
        this.contentEle.style.marginTop = height + 'px';
      } else {
        this.contentEle.style.marginTop = height + 20 + 'px';
      }
      if (this.tocEle != null) {
        this.tocEle.style.top = height + 'px';
      }
      // this.body.style.scrollPaddingTop = height + 60 + 'px';
      // this.main.style.scrollPaddingTop = height + 60 + 'px';
    } else {
      console.log("somthing is null")
    }
  }
}

var waitForFinalEvent = (function() {
  var timers = {};
  return function(callback, ms, uniqueId) {
    if (!uniqueId) {
      uniqueId = "Don't call this twice without a uniqueId";
    }
    if (timers[uniqueId]) {
      clearTimeout(timers[uniqueId]);
    }
    timers[uniqueId] = setTimeout(callback, ms);
  };
})();

$(document).ready(headerResizer.updateMargin);
$(window).resize(function() {
  waitForFinalEvent(headerResizer.updateMargin, 50, "resizeHeaderMarginTop");
});

function clearActiveStatesInTableOfContents() {
  document.querySelectorAll('#TableOfContents li').forEach((section) => {
    section.classList.remove('active');
  });
}

function setTOCIndicator(entries) {
  entries.forEach(entry => {
    const id = entry.target.getAttribute('id');
    // console.log(entry, id, entry.intersectionRatio, entry.isIntersecting)
    if (entry.intersectionRatio > 0) {
      const tocEntry = document.querySelector(`#TableOfContents li a[href="#${id}"]`);
      if (tocEntry && tocEntry.parentElement) {
        clearActiveStatesInTableOfContents();
        tocEntry.parentElement.classList.add('active');
      }
    } else {
      // console.log("remove ", id)
      // document.querySelector(`#TableOfContents li a[href="#${id}"]`).parentElement.classList.remove('active');
    }
  });


  // var allSectionLinks = document.querySelectorAll(".toc-Link");
  // entries.map(i => {
  //     if (i.isIntersecting === true) {
  //         allSectionLinks.forEach(link => link.classList.remove("current"));
  //         document.querySelector(`a[href="#${i.target.id}"]`).classList.add("current");
  //     }
  // })
}

document.addEventListener('DOMContentLoaded', () => {

  const observer = new IntersectionObserver(setTOCIndicator, {
  });

  // Track all sections that have an `id` applied
  ["h1", "h2", "h3", "h4"].forEach(elementType => {
    document.querySelectorAll(`${elementType}[id]`).forEach((section) => {
      observer.observe(section);
      // console.log(`observing ${elementType} ${section.innerHTML}`);
    });
  })
});

document.body.addEventListener('dblclick', function(e) {
  var target = e.target || e.srcElement;
  if (target.className.indexOf("highlight") !== -1
    || target.parentNode.className.indexOf("highlight") !== -1
    || target.parentNode.parentNode.className.indexOf("highlight") !== -1
    || target.nodeName == "CODE") {
    var range, selection;

    if (document.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(target);
      range.select();
    } else if (window.getSelection) {
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(target);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    e.stopPropagation();
  }

});

// 自动处理中英文混排
// 英文合法字符串
function canBeEn(str) {
  // 仅判断：数字字母、逗号、空格、斜杠、ASCII 引号，Unicode 引号，英文圆括号，英文句号，叹号，问号，dash
  return str != undefined && /^[0-9a-zA-Z, //\\\'\"‘’“”\(\)\.\!\?\-]+$/.test(str);
}

function isQuote(char) {
  return (['\'', '\"', '‘', '’', '“', '”']).includes(char);
}

function isEnOnlyQuote(char) {
  return (['\'', '\"']).includes(char);
}

function isOpenQuote(char) {
  return (['‘', '“']).includes(char);
}

function isCloseQuote(char) {
  return (['’', '”']).includes(char);
}

// 目标 index 处若是引号，判断是不是英文引号
// 要求临近字符需要是英文或空格（你好 “eng” 你好）=> （你好 "eng" 你好）
function quotingEn(str, index) {
  if (index == undefined || index < 0 || index >= str.length) {
      console.log(`Checking out of index ${index}`);
      return false;
  }
  if (!isQuote(str[index])) {
      // 不是引号
      return false;
  }

  // 理论上讲开引号后、闭引号前不应该跟空格。
  if (isOpenQuote(str[index])) {
      // 开引号后，需要是英文。
      let nextIsEN = index == str.length - 1 || canBeEn(str[index + 1]);
      return nextIsEN;
  } else if (isCloseQuote(str[index])) {
      // 闭引号前，需要是英文。
      let prevIsEN = index == 0 || canBeEn(str[index - 1]);
      return prevIsEN;
  } else if (isEnOnlyQuote(str[index])) {
      return true;
  }
}

function splitStringByLang(str) {
  let arr = [];
  let push = function(s) {
    // 合并空格
    if ((s.trim().length == 0 && arr.length != 0) || (arr.length == 1 && arr[0].trim().length == 0)) {
        arr[arr.length - 1] = arr[arr.length - 1] + s
    } else {
        arr.push(s)
    }
  }

  let lastStart = 0;
  for (let i = 0; i < str.length; i++) {
      if (canBeEn(str[i]) && // 是英文字符
          (!isQuote(str[i]) || quotingEn(str, i))) { // 若是引号，需要是英文引号
          if (lastStart != i) {
            push(str.slice(lastStart, i));
          }
          lastStart = i;

          i++;
          while (i < str.length && canBeEn(str[i]) && // 是英文字符
              (!isQuote(str[i]) || quotingEn(str, i))) { // 若是引号，需要是英文引号
              i++;
          }
          push(str.slice(lastStart, i));
          lastStart = i;
      }
  }
  if (str.length != lastStart) {
    push(str.slice(lastStart, str.length));
  }
  return arr;
}

function sanitizer(str) {
  let arr = splitStringByLang(str);

  let result = [];
  let isEn = canBeEn(arr[0]);
  // 由于只支持中英，实际上只需要返回第一个元素的语言即可。
  // 不过为了调用者的方便，还是算了。
  for (let i = 0; i < arr.length; i++) {
      result.push({
          lang: isEn ? "en" : "zh",
          content: arr[i],
      });
      isEn = !isEn;
  }
  return result;
}


function addSpan(lang, str){
  return `<span lang='${lang}'>${str}</span>`
}

function tryTranspile(elem) {
  if (!elem.hasChildNodes()) {
    return;
  }
  for(let n = 0; n < elem.childNodes.length; n ++) {
    let node = elem.childNodes[n];
    if(elem.childNodes[n].nodeType != Node.TEXT_NODE) {
      continue;
    }
    
    let str = node.textContent;

    let arr = sanitizer(str);
    if(arr.length == 1) {
      // 仅含一种语言
      return;
    }
    let nextNode = elem.childNodes[n+1];
    for(let i = 0; i < arr.length; i++){
      let newNode = document.createElement("span");
      newNode.lang = arr[i].lang;
      newNode.textContent = arr[i].content;
      elem.insertBefore(newNode, nextNode);
    }
    elem.removeChild(node);
    n = n + arr.length - 1;
  }
}

function updateHeaderLang() {
  $("h1, h2, h3, h4, h5, h6, p").each((i,elem)=>{
    // 整句英文
    if(canBeEn(elem.innerText)) {
      elem.lang="en";
      return;
    }
    tryTranspile(elem);
  })
}

$(document).ready(updateHeaderLang);
