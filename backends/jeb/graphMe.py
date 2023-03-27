#?description=Add node to graph
#?shortcut=Mod1+Mod2+A

import sys
import traceback
from graphUtils import *
from com.pnfsoftware.jeb.client.api import IScript

class graphMe(IScript):
    def run(self, ctx):
        try:
            method = get_current_method(ctx)
            if method:
                update = self.create_method_update(ctx, method)
            else:
                field = get_current_field(ctx)
                if field:
                    update = self.create_field_update(ctx, field)
                else:
                    print("No Selected method or field")
                    return

            update["isNodeTarget"] = get_arrow_direction(ctx)
            send_update(ctx, update)

        except:
            traceback.print_exc(file=sys.stdout)

    def create_method_update(self, ctx, method):
        class_name = method.getClassType().getName(True)
        class_addr = method.getClassType().getSignature(False)
        method_name = method.getName(True)
        addr = method.getSignature(False)

        return {
                "type": "addData", "node": {
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
                }
        }

    def create_field_update(self, ctx, field):
        class_name = field.getClassType().getName(True)
        class_addr = field.getClassType().getSignature(False)
        field_name = field.getName(True)
        addr = field.getSignature(False)

        return {
                "type": "addData", "node": {
                    "project": "Jeb: " + rchop(rchop(ctx.mainProject.name, '.jdb2'), '.apk'),
                    "address": addr, 
                    "class": class_name, 
                    "classAddress": class_addr,
                    "field": field_name, 
                    "computedProperties": [
                        {
                            "name": "label",
                            "format": "{0}::\n_{1}",
                            "replacements": ["class", "field"]
                        }
                    ]
                }
            }

