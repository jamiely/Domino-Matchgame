#LimeJS

##Getting started:

###Mac OS X and Linux users:

- Requirements: Python 2.6+, Git, SVN
- Clone the git repo (you have probably already done that):
    git clone git://github.com/digitalfruit/limejs.git
- bin/lime.py --help
- bin/lime.py init
- bin/lime.py create helloworld

-----

- open ./helloworld/helloworld.html in the browser
- study/tweak the source

-----

- demos are available at lime/demos/
- documentation is at lime/docs/
- programming guide is at lime/guide/
- unit tests are at lime/tests/


###Windows users:

If you consider yourself advanced user and know how to use Git/Python you are probably better off reading through Mac/Linux guide and choosing your best alternative tools/methods yourself. If not then follow this step-by-step route.

1.  Download and install Git client from http://code.google.com/p/msysgit/downloads/list (if not already installed). While installing select "Run Git from the Windows Command Prompt".
2.  Clone lime git repo or download zip package from https://github.com/digitalfruit/limejs/zipball/master
3.  Extract the contents to suitable place on your hard drive. Next examples will use c:\ as the base path.
4.  If you don't have python download and install it from http://www.python.org/download/
5.  Launch Command Prompt (or PowerShell)
6.  Check if you have python installed on your global path by running:
     python --version
    
    If this returned error you have to add it to your global path or use full path to binaries in next steps.

    To add python to your global path:
    
    1. Open Control Panel -> System and Security -> System -> Advanced system settings
    2. Under Advanced tab select Environment Variables...
    3. Under system variables find variable named Path.
    4. Select it and click Edit.
    5. Append semicolon and path to the folder you installed python to the value.
        For example ";C:\Python27\"
    6. Press OK and OK
    7. Restart Command Prompt
    8. Try if it works now

7.  Move to lime base folder
    cd c:\lime
    
8.  python bin/lime.py --help
9.  In similar pattern continue from Mac/Linux tutorial from step 3




##Browser support:

- *Current:* Chrome, Safari 5, Firefox 3.6+(4beta for best performance), Mobile Safari
- *Working:* (but not quite supported): Opera, IE9
- *Soon:* Android
- *Maybe:* Blackberry Playbook, WebOS



##Links:

Closure Library: <http://closure-library.googlecode.com/svn/docs/index.html>

Closure Compiler: <http://code.google.com/closure/compiler/docs/overview.html>

Closure Templates: <http://code.google.com/closure/templates/docs/helloworld_js.html>

Box2D: <http://www.box2dflash.org/docs/2.0.2/reference/>

Canvas 2D API spec: <http://dev.w3.org/html5/2dcontext/>

WebGL spec: <https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/WebGL-spec.html>

Closure book: <http://books.google.com/books?id=p7uyWPcVGZsC&lpg=PP1&ots=x6aPMrK-uP&dq=closure%20the%20definitive%20guide&pg=PP1#v=onepage&q&f=false>

Closure video from Google I/O 2010:
<http://www.youtube.com/watch?v=yp_9q3tgDnQ>



### Known issues:

- Weird mixup on events on scaled elements(at least on polygons)
- Opera & IE9 rotate wrong in potgame
- Transition based animations don't fire stop events on Spawn&Sequence
- ...add your issues to the github page


### Missing/broken:

- Custom Canvas context
- Custom WebGL context
- Frame fill
- Sprite fill
- Web-app installing tutorial
- Unit tests
- Some basic fallback for non supported browsers


### Future:

- Strokes
- More shapes
- Box2D basic integration
- Different shape masks
- More transitions
- Better audio support
- Local cache support
- Other mobile platforms support(Android,WebOS,Playbook)
- Data support(endtable?)
- Gradients
- Resources loading
- Preloader
- WebGL Renderer
- Dev console
- Tiles
- Scrollers
- Menus
- UI controls
- Video support
- Markup with templates
- Integration with MoRe





###Random notes on design (to be later formed into Programming Guide):

It's built upon Google Closure JS library and uses its style but does not use goog.graphics and goog.fx
Cocos2d is where we have taken the base design about what a game is and how it should be developed. Check their docs if you are confused about what director,scene,node and schedulemanager stand for. Animations are also using similar logic.

You will have no problems with display object if you have build games with Flash in ActionScript. It's uses similar movieclip logic. There are layers,sprites and some custom shapes like circles and polygons.  You can change properties like dimensions, position,scale,opacity,anchorpoint,etc and stack them in drawing tree. Anchorpoints and autoresize masks make it easy to have flexible layouts. Masking is also similar to flash where you set one displayobject as mask for another. Fills are object that add displayobjects some visible form.

Events are done in a way you only need game specific parts to make the game work for both mouse or touch screen. In any scenario. You can also swallow() an event so that it remains tied to this object until event ends(touchend,mouseup etc.).

Don't use setTimeout(),setInterval(). There is no need. This is all done by the scheduleManager. You get your ON_ENTER_FRAME style event from that static object. It also draws all object in dirty-objects queue. If you for example change position of a node, the position is set as DIV elements transform property in next frame because object was now marked dirty. As a bonus for sticking with scheduleManager you get pausing support for director.

There are currently two separate renderers. DOM and Canvas. This means that you can make your display list in JS and in any moment call setRenderer(lime.Renderer.DOM) or setRenderer(lime.Renderer.CANVAS) on any node. It will not change anything visually but internally it changes if tree is drawn as separate DIVs or one Canvas. This comes to play if you have different performing devices. For instance canvas is very quick on some PC browsers and dead slow on iOS4.2(where CSS is fast). You can use same code and render it with completely different lower-end technology. Also static content usually performes better on Canvas and dynamic better on CSS. WebGL renderer is also planned for the future.

