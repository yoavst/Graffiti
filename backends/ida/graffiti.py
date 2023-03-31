import json
import socket
import os
import sys

import idaapi
import ida_kernwin
import ida_nalt
import idc
import threading

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

sock = None

class AddToGraphHandler(idaapi.action_handler_t):
    def __init__(self):
        idaapi.action_handler_t.__init__(self)

    # Say hello when invoked.
    def activate(self, ctx):
        global sock
        if ctx.cur_func:
            my_sock = sock
            if my_sock is not None:
                payload = self.create_payload(ctx)
                sock.send(to_bytes(json.dumps(payload)))
            else:
                print("Graffiti: Not connected to server")
        else:
            print("Not currently in a function.")

        return True
    
    def create_payload(self, ctx):
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
                    "label": func_name,
                    "computedProperties": []
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
    
class EnableSyncHandler(idaapi.action_handler_t):
    def __init__(self):
        idaapi.action_handler_t.__init__(self)
        self.thread = None

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

        threading.Thread(target=sync_read_thread).start()

        return True
    
    # This action is always available.
    def update(self, ctx):
        return idaapi.AST_ENABLE_ALWAYS

def sync_read_thread():
    global sock
    print("Background thread running")
    f = sock.makefile()
    try:
        for line in f:
            if not line:
                break
            data = json.loads(line)
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

class GrafitiIDBHooks(idaapi.IDB_Hooks):
    def renamed(self, ea, new_name, is_local):
        global sock
        if sock is not None and new_name:
            payload = {
                "type": "updateNodes",
                "selection": [["address", str(ea)]],
                "update": {
                    "label": new_name
                }
            }
            sock.send(to_bytes(json.dumps(payload)))

hooks = [GraffitiUIHooks(), GrafitiIDBHooks()]
for hook in hooks:
    hook.hook()

# TODO:
# 1. Be able to close IDA
# 2. Support edge direction
