#?description=Add all xrefs to graph 
#?shortcut=Mod1+Mod2+Q

from graphUtils import *
import traceback
import sys
from com.pnfsoftware.jeb.client.api import IScript
from com.pnfsoftware.jeb.core.actions import ActionContext, ActionXrefsData, Actions
from com.pnfsoftware.jeb.core.units.code.java import IJavaSourceUnit


class graphMeXrefs(IScript):
    def run(self, ctx):
        try:
            method = get_current_method(ctx)
            if method:
                update = self.create_method_xrefs_update(ctx, method)
                if update is not None:
                    update["isNodeTarget"] =  False
                    send_update(update)

        except:
            traceback.print_exc(file=sys.stdout)

    def create_method_xrefs_update(self, ctx, method):
        unit = ctx.focusedView.unit
        if unit is None:
            return
        
        target_unit = unit.decompiler.codeUnit if isinstance(unit, IJavaSourceUnit) else unit

        data = ActionXrefsData()
        if unit.prepareExecution(ActionContext(unit, Actions.QUERY_XREFS, 0 if not method else method.itemId, method.address), data):
            methods = []
            methods_addrs = set()
            for xref_addr in data.getAddresses():
                xref_method = target_unit.getMethod(xref_addr)
                if not xref_method:
                    continue
                
                class_name = xref_method.getClassType().getName(True)
                class_addr = xref_method.getClassType().getSignature(False)
                method_name = xref_method.getName(True)
                addr = xref_method.getSignature(False)
                
                if addr in methods_addrs:
                    continue
                methods_addrs.add(addr)

                methods.append({
                    "project": "Jeb: " + rchop(rchop(ctx.mainProject.name, '.jdb2'), '.apk'),
                    "address": addr, 
                    "class": class_name, 
                    "classAddress": class_addr,
                    "method": method_name, 
                    "computedProperties": [
                        {
                            "name": "label",
                            "format": "{0}::\n{1}",
                            "replacements": ["class", "method"]
                        }
                    ]
                })
            
            if methods:
                return { "type": "addDataBulk", "nodes": methods }