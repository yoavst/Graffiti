import json
from java.io import PrintWriter
from java.net import Socket
from com.pnfsoftware.jeb.core.units.code.android import IDexUnit
from com.pnfsoftware.jeb.core.units.code.java import IJavaSourceUnit

def send_update(data):
    s = Socket("localhost", 8764)
    out = PrintWriter(s.getOutputStream(), True)
    out.print(json.dumps(data))
    out.flush()
    s.close()

def get_current_method(ctx):
    view = ctx.getFocusedView()
    unit = view.getUnit()
    if isinstance(unit, IJavaSourceUnit) or isinstance(unit, IDexUnit):
        dexdec = unit.getDecompiler().getCodeUnit()
        f = ctx.getFocusedFragment()
        assert f, 'Need a focused fragment'
        dex_addr = f.getActiveAddress()
        method = dexdec.getMethod(dex_addr)
        return method

    return None
    
