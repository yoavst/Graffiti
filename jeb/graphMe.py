#?description=Add node to graph
#?shortcut=F3

import sys
import traceback
from graphUtils import *
from com.pnfsoftware.jeb.client.api import IScript


class graphMe(IScript):
    def run(self, ctx):
        try:
            method = get_current_method(ctx)

            if method:
                class_name = method.getClassType().getName(True)
                class_addr = method.getClassType().getSignature(False)
                method_name = method.getName(True)
                addr = method.getSignature(False)

                send_update({
                    "type": "addData", "node": {
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
                })

            else:
                print("No method available, try to focus in method")
        except:
            traceback.print_exc(file=sys.stdout)
