#?description=Add the current address node to graph
#?shortcut=Mod1+Mod2+Z

import sys
import traceback
from graphUtils import *
from com.pnfsoftware.jeb.client.api import IScript

class graphMeLine(IScript):
    def run(self, ctx):
        try:
            address = get_current_address(ctx)
            if address:
                method = get_current_method(ctx)
                if method:
                    update = self.create_address_update(ctx, method, address)
                else:
                    print("Not inside a java method")
                    return
            else:
                print("No Selected java address")
                return

            send_update(ctx, update)

        except:
            traceback.print_exc(file=sys.stdout)

    def create_address_update(self, ctx, method, address):
        class_name = method.getClassType().getName(True)
        class_addr = method.getClassType().getSignature(False)
        method_name = method.getName(True)
        method_addr = method.getSignature(False)
        
        # Calculate offset
        try:
            plus_index = address.rindex("+")
            offset = address[plus_index+1:]
        except ValueError:
            offset = "0h"


        return {
                "type": "addData", "node": {
                    "project": "Jeb: " + rchop(rchop(ctx.mainProject.name, '.jdb2'), '.apk'),
                    "address": address, 
                    "class": class_name, 
                    "classAddress": class_addr,
                    "method": method_name, 
                    "methodAddress": method_addr,
                    "line": offset,
                    "computedProperties": [
                        {
                            "name": "label",
                            "format": "{0}::\n{1}+{2}",
                            "replacements": ["class", "method", "line"]
                        }
                    ]
                }
        }