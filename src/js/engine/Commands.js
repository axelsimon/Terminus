_setupCommand('less',null,[ARGT.strictfile],function(args,vt){// event arg -> object
  var r=vt.getContext(),ret=[];
  if (args.length < 1){
    r.fire_event(vt,'less_no_arg',args,0);
    return _('cmd_less_no_arg');
  } else {
    for (var i=0;i<args.length;i++){
      var tgt=r.traversee(args[i]);
      var room=tgt.room;
      if (room){
        var item=tgt.item;
        if (item) {
          vt.push_img(item.picture,{index:ret.length}); // Display image of item
          room.fire_event(vt,'less',args,i);
          item.fire_event(vt,'less',args,i);
          ret.push(cmd_done(vt,[[room,0],[item,i+0]], item.cmd_text.less,'less',args)) ;
        } else {
          room.fire_event(vt,'destination_unreachable',args,i);
          ret.push(_("item_not_exists",args));
        }
      } else {
        room.fire_event(vt,'destination_unreachable',args,i);
        ret.push(_("room_unreachable"));
      }
    }
    return new ReturnSequence(ret);
  }
});
_lnCommand('cat','less');
_lnCommand('more','less');
_setupCommand('ls','dir', [ARGT.dir], function(args,vt){
  var t=vt.getContext();
  var pic;
  console.log(t);
  function printLS(room,render_classes){
    var ret='',pics={},i;
    render_classes=render_classes|| {item:'item',people:'people'};
    if ((room.children.length > 0)||!room.isRoot){
      ret+= _('directions',
        ["\t" + (room.isRoot?'':span('color-room','..')+" (revenir sur tes pas)\n\t") +
          room.children.map(function(n){return span('color-room',n.toString() + '/');}).join("\n\t")]) + "\t\n";
    }
    var items=room.items.filter(function(o){return !o.people;});
    var peoples=room.items.filter(function(o){return o.people;});
    for (i=0;i<peoples.length;i++){
      if (peoples[i].picture && peoples[i].picture.shown_in_ls){
        peoples[i].picture.setOneShotRenderClass(render_classes.people);
        pics['peoples-'+i]=peoples[i].picture;
      }
    }
    if (peoples.length > 0){
      ret+=_('peoples', ["\t" + peoples.map(function(n){return span('color-people',n.toString());}).join("\n\t")]) + "\t\n";
    }
    for (i=0;i<items.length;i++){
      if (items[i].picture && items[i].picture.shown_in_ls){
        items[i].picture.setOneShotRenderClass(render_classes.item);
        pics['item-'+i]=items[i].picture;
      }
    }
    if (items.length > 0){
      ret+= _('items', ["\t" + items.map(function(n){return span('color-item',n.toString());}).join("\n\t")]) + "\t\n";
    }
    return {txt:ret,pics:pics};
  }

  if (args.length > 0){
    var room=t.traversee(args[0]).room;
    if (room) {
      if (!room.readable){
        return _("permission_denied")+' '+_("room_unreadable");
      }
      if (room.children.length === 0 && room.items.length === 0 ){
        prtls={pics:{},txt:_("room_empty")};
      } else {
        prtls=printLS(room);
      }
      pic=room.picture.copy();
      pic.addChildren(prtls.pics);
      pic.setOneShotRenderClass('room');
      vt.push_img(pic); // Display image of room
      return prtls.txt;
    } else {
      return _("room_unreachable");
    }
  } else {
    prtls=printLS(t);
    pic=t.picture.copy();
    pic.addChildren(prtls.pics);
    pic.setOneShotRenderClass('room');
    vt.push_img(pic); // Display image of room
    return prtls.txt;
  }
});
_setupCommand('cd','dir',[ARGT.dir],function(args,vt){
  var t=vt.getContext();
  if (args.length > 1){
    return _('cmd_cd_flood');
  } else if (args[0] === "-") {
    t.previous.previous=t;
    enterRoom(t.previous, vt);
  } else if (args.length === 0){
    return _('cmd_cd_no_args')+(global_hasCmd('pwd')?("\n"+_('cmd_cd_no_args_pwd')):'');
  } else if (args[0] === "~"){
    $home.previous=t;
    enterRoom($home, vt);
    return _('cmd_cd_home');
  } else if (args[0] === "..") {
    t.fire_event(vt,'cd',args,0);
    if (t.parents.length >= 1){
      t.parents[0].previous=t;
      return _('cmd_cd_parent', enterRoom(t.parents[0], vt));
    } else {
      return _('cmd_cd_no_parent');
    }
  } else if (args[0] === ".") {
    vt.push_img(img.room_none);
    return _('cmd_cd',enterRoom(t, vt));
  } else {
    var dest=t.traversee(args[0]);
    var room=dest.room;
    if (room && !dest.item_name) {
      if (room.executable){
        room.previous=t;
        return _('cmd_cd',enterRoom(room,vt));
      } else {
//        t.fire_event(vt,'cd',args,0,{'unreachable_room':room});
        return room.cmd_text.cd;
      }
    }
    t.fire_event(vt,'cd',args,0,{'unreachable_room':room});
    return _('cmd_cd_failed', args);
  }
});


//only valid for command names
_setupCommand('man','help',[ARGT.cmdname],function(args,vt){// event arg -> cmd
  if (args.length < 1){
    return _('cmd_man_no_query');
  } else {
    if (('man_'+args[0]) in dialog){
      return _('man_'+args[0]);
    }
    return _('cmd_man_not_found');
  }
});

_setupCommand('help',null,[ARGT.cmdname], function(args,vt){
  ret=_('cmd_help_begin')+"\n";
  var c=_getUserCommands();
  for (var i=0;i<c.length;i++){
    ret+='<pre>'+c[i]+'\t</pre>: '+_('help_'+c[i])+"\n";
  }
  return ret;
});

_setupCommand('exit',null,[],function(args,vt){
  setTimeout(function(){
    dom.body.innerHTML=_('cmd_exit_html');
  },2000);
  return _('cmd_exit');
});


_setupCommand('pwd',null,[],function(args,vt){
  var t=vt.getContext();
  vt.push_img(t.picture);
  return _(POPREFIX_CMD+'pwd',[t.name]).concat("\n").concat(t.intro_text);
});

_setupCommand('cp',null,[ARGT.file,ARGT.filenew], function(args,vt){//event arg -> destination item
  var t=vt.getContext();
  if (args.length != 2){
    return _('incorrect_syntax');
  } else {
    var src=t.traversee(args[0]);
    var dest=t.traversee(args[1]);
    if (src.item){
      if (dest.item){
        return _('tgt_already_exists',[dest.item_name]);
      } else if (dest.room) {
        nut = src.item.copy(dest.item_name);
        dest.room.addItem(nut);
        nut.fire_event(vt,'cp',args,1);
        src.item.fire_event(vt,'cp',args,0);
        dest.room.fire_event(vt,'cp',args,1);

        return cmd_done(vt,[[src.item,0],[nut,1]], _('cmd_cp_copied', args),'cp',args) ;
      }
    }
    return _('cmd_cp_unknown');
  }
  return _('cmd_unknown');
});
_setupCommand('mv',null,[ARGT.strictfile,ARGT.file],function(args,vt){// event arg -> object (source)
  console.log(args);
  var t=vt.getContext();
  var ret=[],
    src,
    dest = t.traversee(args[args.length-1]),
    item_idx;
  if (dest.item_name && args.length > 2){
    ret.push(_('cmd_mv_flood'));
  } else {
    var retfireables=[],rename,overwritten;
    for (var i=0;i<(args.length-1);i++){
      src = t.traversee(args[i]);
      if (src.room){
        if (src.item && dest.room){
          rename=(dest.item_name && (src.item_name !== dest.item_name));
          overwritten=(dest.item);
          if ( !dest.room.writable ) {
            ret.push(_('permission_denied')+' '+_('cmd_mv_dest_fixed')); 
          } else if (src.item_idx>-1){
            if (src.room.writable){
              if (overwritten){
                dest.room.removeItemByIdx(dest.item_idx);
              }
              if (rename){
                src.item.name=dest.item_name;
              }
              src.room.fire_event(vt,'mv',[args[i],args[args.length-1]],0);
              if (src.room.uid !== dest.room.uid){
                dest.room.addItem(src.item);
                src.room.removeItemByIdx(src.item_idx);
                src.item.fire_event(vt,'mv_outside',[args[i],args[args.length-1]],0);
                if ("mv" in src.item.cmd_text){
                  ret.push(src.item.cmd_text.mv);
                } else {
                  ret.push(_('cmd_mv_done', [args[i],args[args.length-1]]));
                }
              } else {
                src.item.fire_event(vt,'mv_local',[args[i],args[args.length-1]],0);
              }
              src.item.fire_event(vt,'mv',[args[i],args[args.length-1]],0);
              if (rename) {
                src.item.fire_event(vt,'mv_name',args,0);
                if ("mv_name" in src.item.cmd_text){
                  ret.push(src.item.cmd_text.mv_name);
                } else if (!overwritten) {
                  ret.push(_('cmd_mv_name_done', [args[i],args[args.length-1]]));
                }
              }
              if (overwritten){
                ret.push(_('cmd_mv_overwrite_done', [args[i],args[args.length-1]]));
              }
              retfireables.push([src.item,0]);
            } else if ("mv" in src.item.cmd_text){
              ret.push(src.item.cmd_text.mv);
            } else {
              ret.push(_('permission_denied')+' '+_('cmd_mv_fixed')); 
            }
          }
        } else if (!src[2]){
          // got directory
          // TODO mv dir
        }
      } else {
        // got nothing
        ret.push(_('cmd_mv_no_file',[args[i]]));
      }
    }
    return cmd_done(vt,retfireables, ret.join("\n"),'mv',args) ;
    //      return _("cmd_mv_invalid"); 
  }
  return ret.join("\n");
});

_setupCommand('rm',null,[ARGT.file],function(args,vt){// event arg -> object
  var t=vt.getContext();
  if (args.length < 1){
    return _("cmd_rm_miss");
  } else {
    var stringtoreturn = "";
    var item,room,idx;
    for (var i = 0; i < args.length; i++){
      var tgt = t.traversee(args[i]);
      room = tgt.room;
      item = tgt.item;
      idx = tgt.item_idx;
      if (idx>-1){
        if (room.writable){
          var removedItem = room.removeItemByIdx(idx);
          if (removedItem) {
            room.fire_event(vt,'rm',args,i);
            if ("rm" in removedItem.cmd_text){
              stringtoreturn += removedItem.cmd_text.rm + "\n";
            } else {
              stringtoreturn += _('cmd_rm_done', [args[i]]);
            }
          } else {
            stringtoreturn += _('cmd_rm_failed');
          }
        } else {
          return item.cmd_text.rm || _('cmd_rm_invalid');
        }
      }
      return stringtoreturn;
    }
  }
});

_setupCommand('grep',null,[ARGT.pattern,ARGT.strictfile],function(args,vt){
  var t=vt.getContext();
  if (t.hasRightForCommand("grep")){
    var word_to_find = args[0];
    //      var item=t.getItemFromName(args[1]);
    var tgt=t.traversee(args[1]);
    if (tgt.item){
      var item_to_find_in_text = tgt.item.cmd_text.less;
      var line_array = item_to_find_in_text.split("\n");
      var return_arr = line_array.filter(function(line){ return (line.indexOf(word_to_find) > 0);});
      return return_arr.join("\n");
    } else {
      return _('item_not_exists', args);
    }
  }
  return _('cmd_unknown');
});
_setupCommand('touch',null,[ARGT.filenew],function(args,vt){
  var t=vt.getContext();
  if (args.length < 1){
    return _('cmd_touch_nothing');
  } else {
    var createdItemsString = "";
    for (var i = args.length - 1; i >= 0; i--) {
      if (t.getItemFromName(args[i])){
        return _('tgt_already_exists',[args[i]]);
      } else if (args[i].length > 0){
        t.addItem(new Item(args[i], _('item_intro', [args[i]])));
        createdItemsString += args[i];
        t.fire_event(vt,'touch',args,i);
      }
    }
    if (createdItemsString === ""){
      return _('cmd_touch_none');
    }
    return _('cmd_touch_created', [createdItemsString]);
  }
  return _('cmd_unknown');
});


_setupCommand('mkdir',null,[ARGT.dirnew],function(args,vt){//event arg -> created dir
  var t=vt.getContext();
  if (args.length === 1 ){
    var tr=t.traversee(args[0]);
    if ( tr.room.writable ) {
      if ( !tr.item ){
        tr.room.addPath(new Room(t.item_name));
        t.fire_event(vt,'mkdir',args,0);
        return _("room_new_created", args);
      }
      return _('tgt_already_exists',[args[0]]);
    }
    return _("permission_denied")+' '+_("room_not_writable");
  }
  return _("incorrect_syntax");
});
_setupCommand('unzip',null,[ARGT.file.concat(['*.zip'])], function(args,vt){
  var t=vt.getContext();
  if (args.length === 1){
    var tr=t.traversee(args[0]);
    if (tr.item && tr.room.writable){
      tr.item.fire_event(vt,'unzip',args,0);
      return "";
    } else {
      return _("item_cmd_unknow",'unzip');
    }
  }
  return _("incorrect_syntax");
});
_setupCommand('sudo',null,[ARGT.cmd], function(args,vt){
  var t=vt.getContext();
  if (args[0] === "less" && args[1] === "Certificate"){
    t.ev.fire("tryEnterSudo");
    return;
  } else {
    return _("room_wrong_syntax");
  }
  return _("cannot_cast");
});
_setupCommand('poe',null,[ARGT.msgid],function(args,vt){
  var sym=args[0];
  if (sym){
    if (dialog[sym]){
      var cb=function(value){
        dialog[sym]=value;
      };
      vt.ask(_("po_symbol_edit"),cb,{multiline:true,value:dialog[sym]});
      return '';
    } else {
      return _("po_symbol_unknown");
    }
  }
  return _("incorrect_syntax");
});
_setupCommand('pogen','poe', [], function(args,vt){
  var ret=pogen_deliver_link();
  return [ret,function(){
    ret.click();
  }]; 
});

