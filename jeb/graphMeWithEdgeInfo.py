#?description=Add node to graph with label
#?shortcut=F4

import json
import sys
import traceback
from com.pnfsoftware.jeb.client.api import IScript
from com.pnfsoftware.jeb.core.units.code.android import IDexUnit
from com.pnfsoftware.jeb.core.units.code.java import IJavaSourceUnit
from java.io import PrintWriter
from java.net import Socket


class graphMeWithEdgeInfo(IScript):
    def run(self, ctx):
        try:
            view = ctx.getFocusedView()
            unit = view.getUnit()

            if isinstance(unit, IJavaSourceUnit) or isinstance(unit, IDexUnit):
                dexdec = unit.getDecompiler().getCodeUnit()
                f = ctx.getFocusedFragment()
                assert f, 'Need a focused fragment'
                dex_addr = f.getActiveAddress()
                method = dexdec.getMethod(dex_addr)
                assert method, "Need a method"

                name = method.getClassType().getName(True) + "::\n" + method.getName(True)

                edge_text = ctx.displayQuestionBox('Input', 'Enter label for edge', '')
                obj = {
                    "type": "addData", "node": {"label": name, "address": dex_addr}
                }
                if edge_text and edge_text.strip():
                    obj["edge"] = {"label": edge_text}

                s = Socket("localhost", 8764)
                out = PrintWriter(s.getOutputStream(), True)
                out.print(json.dumps(obj))
                out.flush()
                s.close()
        except:
            traceback.print_exc(file=sys.stdout)
