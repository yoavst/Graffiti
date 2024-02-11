import json
import socket
import os
import sys
import struct
import threading

import idaapi
import ida_kernwin
import ida_nalt
import idc
import idautils
import ida_funcs
import ida_segment

def to_bytes(s):
    if sys.version_info.major == 3:
        return s.encode('utf-8')
    else:
        return s

def from_bytes(b):
    if sys.version_info.major == 3:
        return b.decode('utf-8')
    else:
        return b
    
def readexactly(sock, num_bytes):
    buf = b''
    while len(buf) < num_bytes:
        buf += sock.recv(num_bytes - len(buf))

    return buf

def lengthy_send(sock, data):
    sock.send(struct.pack('>i', len(data)))
    sock.send(data)

sock = None

class AddToGraphHandler(idaapi.action_handler_t):
    def __init__(self, force_func=True):
        idaapi.action_handler_t.__init__(self)
        self.force_func = force_func

    # Say hello when invoked.
    def activate(self, ctx):
        global sock
        if ctx.cur_func or not self.force_func:
            my_sock = sock
            if my_sock is not None:
                payload = self.create_payload(ctx)
                if payload:
                    data = to_bytes(json.dumps(payload))
                    lengthy_send(my_sock, data)
                else:
                    print("Graffiti: Empty payload")
            else:
                print("Graffiti: Not connected to server")
        else:
            print("Graffiti: Not currently in a function.")

        return True
    
    def create_payload(self, ctx):
        if ctx.cur_func:
            # Get the name of the current function
            current_func_name = idc.get_func_name(ctx.cur_func.start_ea)
            demangled_func_name = idc.demangle_name(current_func_name, idc.INF_SHORT_DN)
            func_name = demangled_func_name or current_func_name

            # Get the name of the current IDA database
            db_path = ida_nalt.get_input_file_path()
            db_filename = os.path.basename(db_path)

            return {
                    "type": "addData", "node": {
                        "project": "IDA: " + db_filename,
                        "address": str(ctx.cur_func.start_ea), 
                        "baseName": func_name,
                        "baseAddress": str(ctx.cur_func.start_ea),
                        "computedProperties": [
                            {
                                "name": "label",
                                "format": "{0}",
                                "replacements": ["baseName"]
                            }
                        ]
                    }
            }
    # This action is always available.
    def update(self, ctx):
        return idaapi.AST_ENABLE_ALWAYS
    
class AddToGraphWithEdgeInfoHandler(AddToGraphHandler):
    def create_payload(self, ctx):
        base = AddToGraphHandler.create_payload(self, ctx)
        edge_text = ida_kernwin.ask_str('', 2, 'Enter label for edge')
        if edge_text and edge_text.strip():
            base["edge"] = {"label": edge_text}
        return base
    
class AddToGraphLineHandler(AddToGraphHandler):
    def __init__(self):
        AddToGraphHandler.__init__(self, False)

    def create_payload(self, ctx):
        base = AddToGraphHandler.create_payload(self, ctx)
        if base:
            base['node']['computedProperties'] = [
                {
                    "name": "label",
                    "format": "{0}+{1}",
                    "replacements": ["baseName", "line"]
                }
            ]
            base['node']['address'] = str(ctx.cur_ea)
            base['node']['line'] = '{0:x}'.format(ctx.cur_ea - ctx.cur_func.start_ea)
            return base
        else:
            # Non-function address
            db_path = ida_nalt.get_input_file_path()
            db_filename = os.path.basename(db_path)

            return {"type": "addData", "node": raw_node_from_ea(ctx.cur_ea, db_filename)}
    
class AddXrefsHandler(AddToGraphHandler):
    def __init__(self, line_xrefs=False):
        AddToGraphHandler.__init__(self)
        self.line_xrefs = line_xrefs

    def create_payload(self, ctx):
        db_path = ida_nalt.get_input_file_path()
        db_filename = os.path.basename(db_path)


        nodes = []
        for xref in idautils.XrefsTo(ctx.cur_func.start_ea):
            f = ida_funcs.get_func(xref.frm)
            if f is None:
                # Raw address
                nodes.append(raw_node_from_ea(xref.frm, db_filename))
            else:
                original_func_name = idc.get_func_name(f.start_ea)
                demangled_func_name = idc.demangle_name(original_func_name, idc.INF_SHORT_DN)
                func_name = demangled_func_name or original_func_name

                node = {
                    "project": "IDA: " + db_filename,
                    "baseName": func_name,
                    "baseAddress": str(f.start_ea)
                }
                if not self.line_xrefs:
                    node['address'] = str(f.start_ea)
                    node['computedProperties'] = [
                        {
                            "name": "label",
                            "format": "{0}",
                            "replacements": ["baseName"]
                        }
                    ]
                else:
                    node['address'] = str(xref.frm)
                    node['line'] = '{0:x}'.format(xref.frm - f.start_ea)
                    node['computedProperties'] = [
                        {
                            "name": "label",
                            "format": "{0}+{1}",
                            "replacements": ["baseName", "line"]
                        }
                    ]
                nodes.append(node)
        
        if nodes:
            return { "type": "addDataBulk", "nodes": nodes, "direction": "n2e" }
        
def raw_node_from_ea(ea, db_filename):
    seg = ida_segment.getseg(ea)
    if seg:
        seg_name =  ida_segment.get_segm_name(seg) + ":"
    else:
        seg_name = ""
    
    name = idc.get_name(ea, idc.GN_DEMANGLED)
    if not name or name == idc.BADADDR:
        name = '{0:x}'.format(ea)

    return {
        "project": "IDA: " + db_filename,
        "baseAddress": str(ea),
        "address": str(ea),
        "line": '{0:x}'.format(ea),
        "baseName": name,
        "seg": seg_name,
        "computedProperties": [
            {
                "name": "label",
                "format": "{0}{1}",
                "replacements": ["seg", "baseName"]
            }
        ]
    }
        
class AddXrefLinesHandler(AddXrefsHandler):
    def __init__(self):
        AddXrefsHandler.__init__(self, True)

    
class EnableSyncHandler(idaapi.action_handler_t):
    def __init__(self):
        idaapi.action_handler_t.__init__(self)

    # Say hello when invoked.
    def activate(self, ctx):
        global sock
        if sock is not None:
            sock.close()
            sock = None
        
        addr = ida_kernwin.ask_str('localhost:8501', 2, 'What is the address of the grafiti server?')
        if not addr: 
            return
        
        addr, port = addr.split(':')
        sock = socket.socket()
        sock.connect((addr, int(port)))

        thread = threading.Thread(target=sync_read_thread)
        thread.daemon = True
        thread.start()

        return True
    
    # This action is always available.
    def update(self, ctx):
        return idaapi.AST_ENABLE_ALWAYS

def sync_read_thread():
    global sock
    print("Background thread running")
    try:
        while True:
            length = struct.unpack('>i', readexactly(sock, 4))[0]
            data = json.loads(readexactly(sock, length))
                   
            if 'project' in data:
                if not data['project'].startswith('IDA:'):
                    continue
                
            addr = int(data['address'])
            def on_ui():
                ida_kernwin.jumpto(addr)
                return False

            ida_kernwin.execute_ui_requests([on_ui])
    except socket.error:
        print("Socket is closed")
        sock = None


# 2) Describe the actions
add_to_graph_action_desc = idaapi.action_desc_t(
    'graffiti:addToGraph', 
    'Graffiti: Add to graph',  # The action text.
    AddToGraphHandler(),   # The action handler.
    'Ctrl+Shift+A',      # Optional: the action shortcut
    'Add to graph'
    )
add_to_graph_with_edge_info_action_desc = idaapi.action_desc_t(
    'graffiti:addToGraphWithEdgeInfo', 
    'Graffiti: Add to graph with edge comment',  # The action text.
    AddToGraphWithEdgeInfoHandler(),   # The action handler.
    'Ctrl+Shift+X',      # Optional: the action shortcut
    'Add to graph with edge comment'
    )
add_line_to_graph_action_desc = idaapi.action_desc_t(
    'graffiti:addLineToGraph', 
    'Graffiti: Add current line to graph',  # The action text.
    AddToGraphLineHandler(),   # The action handler.
    'Ctrl+Alt+A',      # Optional: the action shortcut
    'Add line to graph'
    )
add_xrefs_to_graph_action_desc = idaapi.action_desc_t(
    'graffiti:addXrefsToGraph', 
    'Graffiti: Add function xrefs to graph',  # The action text.
    AddXrefsHandler(),   # The action handler.
    'Ctrl+Shift+Q',      # Optional: the action shortcut
    'Add function xrefs to graph'
    )
add_xrefs_lines_to_graph_action_desc = idaapi.action_desc_t(
    'graffiti:addXrefLinesToGraph', 
    'Graffiti: Add line xrefs to graph',  # The action text.
    AddXrefLinesHandler(),   # The action handler.
    'Ctrl+Alt+Shift+Q',      # Optional: the action shortcut
    'Add line xrefs to graph'
    )

enable_graffiti_sync_action_desc = idaapi.action_desc_t(
    'graffiti:ConnectToServer', 
    'Graffiti: Connect to server',  # The action text.
    EnableSyncHandler(),   # The action handler.
    None,      # Optional: the action shortcut
    'Connect To Server'
    )          

# 3) Register the action
idaapi.unregister_action('graffiti:addToGraph')
idaapi.register_action(add_to_graph_action_desc)
idaapi.unregister_action('graffiti:addToGraphWithEdgeInfo')
idaapi.register_action(add_to_graph_with_edge_info_action_desc)
idaapi.unregister_action('graffiti:addLineToGraph')
idaapi.register_action(add_line_to_graph_action_desc)
idaapi.unregister_action('graffiti:addXrefsToGraph')
idaapi.register_action(add_xrefs_to_graph_action_desc)
idaapi.unregister_action('graffiti:addXrefLinesToGraph')
idaapi.register_action(add_xrefs_lines_to_graph_action_desc)
idaapi.unregister_action('graffiti:ConnectToServer')
idaapi.register_action(enable_graffiti_sync_action_desc)

idaapi.attach_action_to_menu(
        'Options/Source paths...', 
        'graffiti:ConnectToServer',                    
        idaapi.SETMENU_APP)          

# 4) Register hooks
class GraffitiUIHooks(idaapi.UI_Hooks):
    def finish_populating_widget_popup(self, form, popup):
        if idaapi.get_widget_type(form) == idaapi.BWN_DISASM or idaapi.get_widget_type(form) == idaapi.BWN_PSEUDOCODE:
            idaapi.attach_action_to_popup(form, popup, "graffiti:addToGraph", "Graffiti/")
            idaapi.attach_action_to_popup(form, popup, "graffiti:addToGraphWithEdgeInfo", "Graffiti/")
            idaapi.attach_action_to_popup(form, popup, "graffiti:addLineToGraph", "Graffiti/")
            idaapi.attach_action_to_popup(form, popup, "graffiti:addXrefsToGraph", "Graffiti/")
            idaapi.attach_action_to_popup(form, popup, "graffiti:addXrefLinesToGraph", "Graffiti/")            

class GrafitiIDBHooks(idaapi.IDB_Hooks):
    def renamed(self, ea, new_name, is_local):
        global sock
        if sock is not None and new_name:
            payload = {
                "type": "updateNodes",
                "selection": [["baseAddress", str(ea)]],
                "update": {
                    "baseName": new_name
                }
            }
            lengthy_send(sock, to_bytes(json.dumps(payload)))

hooks = [GraffitiUIHooks(), GrafitiIDBHooks()]
for hook in hooks:
    hook.hook()
